const admin = require('../config/firebase');

const uid = '4vtlO6Xr7EMcOSCdispIZHmLaPs2'; 

const tenantId = 'user1'; 

admin.auth().createCustomToken(uid)  
.then((customToken) => {
    console.log("Custom Token:", customToken);
    return admin.auth().setCustomUserClaims(uid, { tenantId: tenantId });
})
.then(() => {
    console.log(`Custom claim 'tenantId: ${tenantId}' set for user ${uid}`);
})
.catch((error) => {
    console.error("Error creating custom token or setting claims:", error);
});
