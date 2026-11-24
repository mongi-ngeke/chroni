import { describe, expect, it } from "vitest";
import { parseEnv } from "./parse-env";

const valid = {
  NODE_ENV: "test",
  DATABASE_URL: "postgresql://dev:pwd@localhost:5432/chroni",
};

describe("parseEnv", () => {
  it("returns typed values when the environment is valid", () => {
    expect(parseEnv(valid)).toEqual(valid);
  });

  it("fails and names the missing variable", () => {
    expect(() => parseEnv({ NODE_ENV: "test" })).toThrow(/DATABASE_URL/);
  });

  it("fails when DATABASE_URL is not a URL", () => {
    expect(() => parseEnv({ ...valid, DATABASE_URL: "nope" })).toThrow(/DATABASE_URL/);
  });

  it("fails when NODE_ENV is unknown", () => {
    expect(() => parseEnv({ ...valid, NODE_ENV: "staging" })).toThrow(/NODE_ENV/);
  });

  it("does not leak the value of invalid variables in the message", () => {
    expect(() => parseEnv({ ...valid, DATABASE_URL: "secret-value" })).not.toThrow(/secret-value/);
  });
});
