import {
  type DataCellDefinition,
  type DataFieldDefinition,
  type DataRecordDefinition,
  type DataRecordLinkDefinition,
  fieldConfigString,
  fieldConfigStrings,
  type MaterializedRecord,
  type MaterializedValue,
} from "./types";

function storedCellValue(cell: DataCellDefinition): MaterializedValue {
  if (cell.text_value !== null) return cell.text_value;
  if (cell.number_value !== null) return String(cell.number_value);
  if (cell.boolean_value !== null) return cell.boolean_value;
  if (cell.date_value !== null) return cell.date_value;
  if (cell.option_value !== null) return cell.option_value;
  if (Array.isArray(cell.json_value)) {
    return cell.json_value.filter((value): value is string => typeof value === "string");
  }
  return null;
}

const decimalPattern = /^(-?)(\d+)(?:\.(\d+))?$/;
const formulaScale = 6;
const scaleFactor = 10n ** BigInt(formulaScale);

function parseDecimal(value: MaterializedValue): bigint | null {
  if (typeof value !== "string") return null;
  const match = decimalPattern.exec(value.trim());
  if (!match) return null;
  const [, sign, whole = "0", fraction = ""] = match;
  const magnitude = BigInt(whole) * scaleFactor + BigInt(fraction.slice(0, formulaScale).padEnd(formulaScale, "0") || "0");
  return sign === "-" ? -magnitude : magnitude;
}

function formatDecimal(value: bigint) {
  const negative = value < 0n;
  const magnitude = negative ? -value : value;
  const whole = magnitude / scaleFactor;
  const fraction = (magnitude % scaleFactor).toString().padStart(formulaScale, "0").replace(/0+$/, "");
  return `${negative ? "-" : ""}${whole}${fraction ? `.${fraction}` : ""}`;
}

function calculateFormula(field: DataFieldDefinition, values: Record<string, MaterializedValue>) {
  const sourceIds = fieldConfigStrings(field, "sourceFieldIds");
  const operator = fieldConfigString(field, "operator");
  const sourceValues = sourceIds.map((id) => values[id] ?? null);
  if (operator === "concatenate") {
    return sourceValues
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .filter((value): value is string => typeof value === "string" && value.length > 0)
      .join(" ");
  }
  if (operator === "count") {
    return String(sourceValues.reduce((total, value) => total + (Array.isArray(value) ? value.length : value === null || value === "" ? 0 : 1), 0));
  }
  const numbers = sourceValues.map(parseDecimal).filter((value): value is bigint => value !== null);
  if (!numbers.length) return null;
  if (operator === "sum") return formatDecimal(numbers.reduce((total, value) => total + value, 0n));
  const first = numbers[0];
  if (first === undefined) return null;
  if (operator === "difference") return formatDecimal(numbers.slice(1).reduce((total, value) => total - value, first));
  if (operator === "multiply") return formatDecimal(numbers.slice(1).reduce((total, value) => (total * value) / scaleFactor, first));
  const second = numbers[1];
  if (operator === "percent" && second !== undefined && second !== 0n) {
    return formatDecimal((first * 100n * scaleFactor) / second);
  }
  return null;
}

export function materializeDataRecords(
  fields: DataFieldDefinition[],
  records: DataRecordDefinition[],
  cells: DataCellDefinition[],
  links: DataRecordLinkDefinition[],
): MaterializedRecord[] {
  const fieldsByTable = new Map<string, DataFieldDefinition[]>();
  for (const field of fields) {
    const group = fieldsByTable.get(field.table_id) ?? [];
    group.push(field);
    fieldsByTable.set(field.table_id, group);
  }

  const valuesByRecord = new Map<string, Record<string, MaterializedValue>>();
  for (const record of records) valuesByRecord.set(record.id, {});
  for (const cell of cells) {
    const values = valuesByRecord.get(cell.record_id);
    if (values) values[cell.field_id] = storedCellValue(cell);
  }
  for (const link of [...links].sort((left, right) => left.position - right.position)) {
    const values = valuesByRecord.get(link.source_record_id);
    if (!values) continue;
    const current = values[link.field_id];
    values[link.field_id] = [...(Array.isArray(current) ? current : []), link.target_record_id];
  }

  const labels = new Map<string, string>();
  for (const record of records) {
    const primary = fieldsByTable.get(record.table_id)?.find((field) => field.is_primary);
    const value = primary ? valuesByRecord.get(record.id)?.[primary.id] : null;
    labels.set(record.id, typeof value === "string" && value.trim() ? value : `Record ${record.record_number}`);
  }

  for (const record of records) {
    const values = valuesByRecord.get(record.id) ?? {};
    const recordFields = fieldsByTable.get(record.table_id) ?? [];
    for (const field of recordFields.filter((candidate) => candidate.field_type === "lookup")) {
      const targetIds = field.lookup_link_field_id ? values[field.lookup_link_field_id] : null;
      if (!Array.isArray(targetIds) || !field.lookup_target_field_id) {
        values[field.id] = null;
        continue;
      }
      values[field.id] = targetIds.flatMap((targetId) => {
        const target = valuesByRecord.get(targetId)?.[field.lookup_target_field_id ?? ""];
        if (Array.isArray(target)) return target.map((id) => labels.get(id) ?? id);
        return target === null || target === undefined ? [] : [String(target)];
      });
    }
    for (const field of recordFields.filter((candidate) => candidate.field_type === "formula")) {
      values[field.id] = calculateFormula(field, values);
    }
  }

  return records.map((record) => ({
    ...record,
    label: labels.get(record.id) ?? `Record ${record.record_number}`,
    values: valuesByRecord.get(record.id) ?? {},
  }));
}

export function linkedRecordLabels(value: MaterializedValue, records: Map<string, MaterializedRecord>) {
  if (!Array.isArray(value)) return [];
  return value.map((id) => records.get(id)?.label ?? "Missing record");
}
