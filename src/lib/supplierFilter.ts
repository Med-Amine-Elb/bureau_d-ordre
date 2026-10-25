function normalizeSupplierName(value: string) {
  return value.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr-FR");
}

export function matchesSupplierFilter(supplierName: string | undefined, filterText: string): boolean {
  const query = normalizeSupplierName(filterText);
  return query.length === 0 || normalizeSupplierName(supplierName ?? "").includes(query);
}
