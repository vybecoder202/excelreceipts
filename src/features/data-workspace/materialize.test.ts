import { describe, expect, it } from "vitest";

import { materializeDataRecords } from "./materialize";
import type { DataCellDefinition, DataFieldDefinition, DataRecordDefinition, DataRecordLinkDefinition } from "./types";

const field = (value: Partial<DataFieldDefinition> & Pick<DataFieldDefinition, "id" | "table_id" | "name" | "field_type">): DataFieldDefinition => ({
  project_id: "project",
  position: 0,
  is_primary: false,
  is_required: false,
  config: {},
  linked_table_id: null,
  lookup_link_field_id: null,
  lookup_target_field_id: null,
  ...value,
});

const record = (id: string, tableId: string, number: number): DataRecordDefinition => ({
  id,
  table_id: tableId,
  record_number: number,
  position: number * 1024,
  created_at: "2026-08-14T00:00:00Z",
  updated_at: "2026-08-14T00:00:00Z",
});

const cell = (recordId: string, fieldId: string, text: string | null, number: number | null = null): DataCellDefinition => ({
  record_id: recordId,
  field_id: fieldId,
  text_value: text,
  number_value: number,
  boolean_value: null,
  date_value: null,
  option_value: null,
  json_value: null,
});

describe("materializeDataRecords", () => {
  it("resolves linked records and lookup values", () => {
    const fields = [
      field({ id: "supplier-name", table_id: "suppliers", name: "Supplier", field_type: "text", is_primary: true }),
      field({ id: "supplier-phone", table_id: "suppliers", name: "Phone", field_type: "phone" }),
      field({ id: "expense-name", table_id: "expenses", name: "Expense", field_type: "text", is_primary: true }),
      field({ id: "expense-supplier", table_id: "expenses", name: "Supplier", field_type: "link", linked_table_id: "suppliers" }),
      field({ id: "expense-phone", table_id: "expenses", name: "Supplier phone", field_type: "lookup", lookup_link_field_id: "expense-supplier", lookup_target_field_id: "supplier-phone" }),
    ];
    const records = [record("supplier-1", "suppliers", 1), record("expense-1", "expenses", 2)];
    const cells = [cell("supplier-1", "supplier-name", "Lusaka Supply"), cell("supplier-1", "supplier-phone", "+260 97 000 0000"), cell("expense-1", "expense-name", "Cement")];
    const links: DataRecordLinkDefinition[] = [{ field_id: "expense-supplier", source_record_id: "expense-1", target_record_id: "supplier-1", position: 0 }];

    const result = materializeDataRecords(fields, records, cells, links);
    expect(result[1]!.values["expense-phone"]).toEqual(["+260 97 000 0000"]);
    expect(result[0]!.label).toBe("Lusaka Supply");
  });

  it("calculates decimal formulas without binary floating point arithmetic", () => {
    const fields = [
      field({ id: "name", table_id: "costs", name: "Name", field_type: "text", is_primary: true }),
      field({ id: "quantity", table_id: "costs", name: "Quantity", field_type: "number" }),
      field({ id: "rate", table_id: "costs", name: "Rate", field_type: "currency" }),
      field({ id: "total", table_id: "costs", name: "Total", field_type: "formula", config: { operator: "multiply", sourceFieldIds: ["quantity", "rate"] } }),
    ];
    const result = materializeDataRecords(fields, [record("cost-1", "costs", 1)], [
      cell("cost-1", "name", "Bricks"),
      cell("cost-1", "quantity", null, 3),
      cell("cost-1", "rate", null, 12.5),
    ], []);
    expect(result[0]!.values.total).toBe("37.5");
  });
});
