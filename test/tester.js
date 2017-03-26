

function authenticate(agent, credentials) {
  return agent
  .post("/api/user/login")
  .send(credentials)
  .expect(200);
}

module.exports = {
  authenticate: authenticate
};
