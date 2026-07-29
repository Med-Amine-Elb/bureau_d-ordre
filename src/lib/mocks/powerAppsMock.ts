export class PowerAppsService {}
export const multiSelectPicklistUtils = {};
export const getClient = () => ({
  retrieveMultiple: () => Promise.resolve({ value: [] }),
  createRecord: () => Promise.resolve({}),
  updateRecord: () => Promise.resolve({}),
});
export default {};
