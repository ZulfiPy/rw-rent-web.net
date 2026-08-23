// Importing a handler module registers its routes. Deliverable B adds the fleet resources
// (vehicles, customers, drivers, rental assignments, authorizations, interruptions) and the
// authentication family; an unregistered route deliberately 404s until then.
import './me';
import './users';
import './roles';
import './sessions';
import './securityAudit';
import './companies';
