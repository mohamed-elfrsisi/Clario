// tests/helpers/uniqueEmail.js
//
// Every integration test that creates a user needs a unique email so
// tests don't collide with each other or with the seed data already in
// the development database (mohamed.test@clario.local, etc).
//
// All test-created emails use the qa.*@clario.test pattern so they are
// trivially identifiable and safe to delete in afterAll() without ever
// touching real seed data or another table.

let counter = 0;

function uniqueTestEmail() {
  counter += 1;
  return `qa.${Date.now()}.${counter}@clario.test`;
}

module.exports = { uniqueTestEmail };
