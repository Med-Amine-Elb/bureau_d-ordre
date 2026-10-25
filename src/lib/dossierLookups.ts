import { dataService } from "./dataService";

// Each reference list is independent: a failed dossier/user query must not
// discard successfully retrieved suppliers, companies or departments.
export async function loadDossierLookups() {
  const [suppliers, companies, departments, users, dossiers] = await Promise.allSettled([
    dataService.getFournisseursLookup(),
    dataService.getCompaniesLookup(),
    dataService.getDepartmentsLookup(),
    dataService.getUsers(),
    dataService.getDossiers(),
  ]);
  const errors: string[] = [];
  const value = <T>(result: PromiseSettledResult<T[]>, label: string): T[] => {
    if (result.status === "fulfilled") return result.value;
    errors.push(label);
    return [];
  };
  return {
    suppliers: value(suppliers, "fournisseurs"),
    companies: value(companies, "sociétés GBM"),
    departments: value(departments, "directions"),
    users: value(users, "utilisateurs"),
    dossiers: value(dossiers, "dossiers liés"),
    errors,
  };
}
