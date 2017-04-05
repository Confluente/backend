

function authenticate(agent, credentials) {
  return agent
  .post("/api/auth/login")
  .send(credentials)
  .expect(200);
}

module.exports = {
  authenticate: authenticate
};
