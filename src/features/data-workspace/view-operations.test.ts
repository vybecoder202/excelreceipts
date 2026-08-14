import { describe, expect, it } from "vitest";

import type { DataFieldDefinition, MaterializedRecord } from "./types";
import { applyDataViewOperations, groupDataRecords } from "./view-operations";

const fields = [
  { id: "name", name: "Name", field_type: "text" },
  { id: "amount", name: "Amount", field_type: "currency" },
  { id: "status", name: "Status", field_type: "single_select" },
].map((field, position) => ({
  ...field,
  project_id: "project",
  table_id: "table",
  position,
  is_primary: position === 0,
  is_required: false,
  config: {},
  linked_table_id: null,
  lookup_link_field_id: null,
  lookup_target_field_id: null,
})) as DataFieldDefinition[];

const records = [
  { id: "a", table_id: "table", record_number: 1, position: 1024, created_at: "2026-01-01", updated_at: "2026-01-01", label: "Bricks", values: { name: "Bricks", amount: "20", status: "Ordered" } },
  { id: "b", table_id: "table", record_number: 2, position: 2048, created_at: "2026-01-01", updated_at: "2026-01-01", label: "Cement", values: { name: "Cement", amount: "100", status: "Received" } },
  { id: "c", table_id: "table", record_number: 3, position: 3072, created_at: "2026-01-01", updated_at: "2026-01-01", label: "Sand", values: { name: "Sand", amount: null, status: "Ordered" } },
] satisfies MaterializedRecord[];

describe("data view operations", () => {
  it("filters text values with a chosen operator", () => {
    expect(applyDataViewOperations(records, fields, { filterField: "name", filterOp: "contains", filterValue: "men" }).map((record) => record.id)).toEqual(["b"]);
  });

  it("sorts numeric fields numerically and keeps empty values last", () => {
    expect(applyDataViewOperations(records, fields, { sortField: "amount", sortDir: "asc" }).map((record) => record.id)).toEqual(["a", "b", "c"]);
  });

  it("groups records and gives empty values a useful label", () => {
    expect(groupDataRecords(records, "status").map((group) => [group.label, group.records.length])).toEqual([["Ordered", 2], ["Received", 1]]);
    expect(groupDataRecords(records, "amount").at(-1)?.label).toBe("No value");
  });
});
