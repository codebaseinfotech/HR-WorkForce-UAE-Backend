import { hasPermission, ROLES } from './src/utils/roleConfig.js';
console.log("COMPANY ROLE: ", ROLES.COMPANY);
console.log("salaries: ", hasPermission(ROLES.COMPANY, '/company/salaries'));
console.log("live-location: ", hasPermission(ROLES.COMPANY, '/company/live-location'));
console.log("chat: ", hasPermission(ROLES.COMPANY, '/company/chat'));
console.log("managers: ", hasPermission(ROLES.COMPANY, '/company/managers'));
console.log("admin salaries: ", hasPermission('admin', '/company/salaries'));
