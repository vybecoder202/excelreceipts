import { describe, expect, it } from "vitest";
import { createUniqueLinks } from "../src/excel/linkRepository";
import { nextDocumentId, nextExpenseId } from "../src/services/idService";
import { parseMoneyToMinorUnits } from "../src/services/money";
import { reconcileDocument } from "../src/services/reconciliationService";
import type { Expense, ManagedDocument } from "../src/types/models";

describe("idService", () => {
  it("generates stable next document IDs", () => {
    expect(nextDocumentId(["DOC-000001", "DOC-000009", "BAD"])).toBe("DOC-000010");
  });

  it("generates stable next expense IDs", () => {
    expect(nextExpenseId(["EXP-000001"])).toBe("EXP-000002");
  });
});

describe("money", () => {
  it("parses formatted ZMW values exactly", () => {
    expect(parseMoneyToMinorUnits("K3,650.75")).toBe(365075n);
  });
});

describe("linkRepository", () => {
  it("prevents duplicate many-to-many links", () => {
    const links = createUniqueLinks([{ expenseId: "EXP-000001", documentId: "DOC-000001", linkedAt: "now" }], [
      "EXP-000001",
      "EXP-000002",
      "EXP-000002"
    ], "DOC-000001");

    expect(links).toEqual([{ expenseId: "EXP-000002", documentId: "DOC-000001", linkedAt: expect.any(String) }]);
  });
});

describe("reconciliationService", () => {
  const document: ManagedDocument = {
    documentId: "DOC-000048",
    fileName: "receipt.pdf",
    originalFileName: "receipt.pdf",
    fileType: "application/pdf",
    storageKey: "key",
    documentTotal: "3650",
    createdAt: "2026-08-31T00:00:00.000Z"
  };

  it("balances a document total against linked expenses", () => {
    const expenses: Expense[] = [
      { expenseId: "EXP-0101", worksheet: "Expenses", tableName: "tblExpenses", rowNumber: 2, amount: "2400" },
      { expenseId: "EXP-0102", worksheet: "Expenses", tableName: "tblExpenses", rowNumber: 3, amount: "350" },
      { expenseId: "EXP-0103", worksheet: "Expenses", tableName: "tblExpenses", rowNumber: 4, amount: "900" }
    ];

    expect(reconcileDocument(document, expenses)).toMatchObject({
      linkedExpenseTotal: "3650.00",
      difference: "0.00",
      isBalanced: true
    });
  });

  it("reports informational differences without blocking", () => {
    const expenses: Expense[] = [
      { expenseId: "EXP-0101", worksheet: "Expenses", tableName: "tblExpenses", rowNumber: 2, amount: "3550" }
    ];

    expect(reconcileDocument(document, expenses)).toMatchObject({
      linkedExpenseTotal: "3550.00",
      difference: "100.00",
      isBalanced: false
    });
  });
});
