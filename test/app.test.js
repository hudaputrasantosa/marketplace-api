const supertest = require("supertest");
const createServer = require("../src/utils/server");

let token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluQGdtYWlsLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTcwOTM4NTcyMCwiZXhwIjoxNzA5Mzg5MzIwfQ.ck3XX6kPVvVq0qMyHWpvZhPf5Im0c-olDHLi1f3rfw";

const app = createServer();
describe("produk", () => {
  describe("get produk routes", () => {
    describe("given the produk does not authorized", () => {
      it("should return 401", async () => {
        let id = "8";
        const response = await supertest(app).get(`/api/produks/${id}`);
        expect(response.statusCode).toBe(401);
      });
    });
    describe("given the token expired", () => {
      it("should return 403", async () => {
        let id = "2";
        const response = await supertest(app)
          .get(`/api/produks/${id}`)
          .set("Authorization", `Bearer ${token}`);
        expect(response.statusCode).toBe(403);
      });
    });
  });
});
