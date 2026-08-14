import type { DataFieldDefinition, MaterializedRecord, MaterializedValue } from "./types";

export const filterOperators = ["contains", "equals", "is_empty", "is_not_empty"] as const;
export type FilterOperator = (typeof filterOperators)[number];

export type DataViewQuery = {
  filterField?: string;
  filterOp?: string;
  filterValue?: string;
  sortField?: string;
  sortDir?: string;
  groupField?: string;
};

function valueText(value: MaterializedValue | undefined) {
  if (Array.isArray(value)) return value.join(" ");
  if (value === true) return "true";
  if (value === false) return "false";
  return String(value ?? "");
}

function isEmpty(value: MaterializedValue | undefined) {
  return value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0);
}

function compareValues(left: MaterializedValue | undefined, right: MaterializedValue | undefined, field?: DataFieldDefinition) {
  if (isEmpty(left) && isEmpty(right)) return 0;
  if (isEmpty(left)) return 1;
  if (isEmpty(right)) return -1;
  if (field && ["number", "currency", "formula"].includes(field.field_type)) {
    const numericLeft = Number(valueText(left));
    const numericRight = Number(valueText(right));
    if (Number.isFinite(numericLeft) && Number.isFinite(numericRight)) return numericLeft - numericRight;
  }
  return valueText(left).localeCompare(valueText(right), undefined, { numeric: true, sensitivity: "base" });
}

export function applyDataViewOperations(
  records: MaterializedRecord[],
  fields: DataFieldDefinition[],
  query: DataViewQuery,
) {
  const fieldIds = new Set(fields.map((field) => field.id));
  const filterField = query.filterField && fieldIds.has(query.filterField) ? query.filterField : undefined;
  const filterOp = filterOperators.includes(query.filterOp as FilterOperator) ? query.filterOp as FilterOperator : "contains";
  const filterValue = query.filterValue?.trim().toLocaleLowerCase() ?? "";

  const filtered = filterField
    ? records.filter((record) => {
        const value = record.values[filterField];
        if (filterOp === "is_empty") return isEmpty(value);
        if (filterOp === "is_not_empty") return !isEmpty(value);
        const text = valueText(value).toLocaleLowerCase();
        return filterOp === "equals" ? text === filterValue : text.includes(filterValue);
      })
    : records;

  const sortField = query.sortField && fieldIds.has(query.sortField) ? query.sortField : undefined;
  if (!sortField) return filtered;
  const field = fields.find((candidate) => candidate.id === sortField);
  const direction = query.sortDir === "desc" ? -1 : 1;
  return filtered
    .map((record, index) => ({ record, index }))
    .sort((left, right) => {
      const comparison = compareValues(left.record.values[sortField], right.record.values[sortField], field);
      return comparison === 0 ? left.index - right.index : comparison * direction;
    })
    .map(({ record }) => record);
}

export function groupDataRecords(records: MaterializedRecord[], fieldId?: string) {
  if (!fieldId) return [{ key: "all", label: "All records", records }];
  const groups = new Map<string, MaterializedRecord[]>();
  for (const record of records) {
    const value = record.values[fieldId];
    const label = isEmpty(value) ? "No value" : Array.isArray(value) ? value.join(", ") : String(value);
    const group = groups.get(label) ?? [];
    group.push(record);
    groups.set(label, group);
  }
  return [...groups].map(([label, groupRecords]) => ({ key: label, label, records: groupRecords }));
}
