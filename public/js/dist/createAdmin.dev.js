"use strict";

function createUser(uid, name, role) {
  firebase.database().ref("users/" + uid).set({
    display_name: name,
    role: role,
    created_at: new Date().toISOString()
  }).then(function () {
    console.log("สร้าง user สำเร็จ");
  })["catch"](function (error) {
    console.error(error);
  });
}

createUser("admin_1", "admin_blink", "admin");