// Importing a handler module registers its routes. The authentication family and the fleet write
// routes arrive with their screens; an unregistered route deliberately 404s until then.
import './me';
import './users';
import './roles';
import './sessions';
import './securityAudit';
import './companies';
import './fleet';
import './auth';
