export async function readTableBodyValues(context: Excel.RequestContext, table: Excel.Table): Promise<(string | number | boolean)[][]> {
  const rows = table.rows.load("items");
  await context.sync();
  if (rows.items.length === 0) {
    return [];
  }
  const body = table.getDataBodyRange().load("values");
  await context.sync();
  return body.values;
}
