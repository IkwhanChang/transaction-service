export const isInt = n => /^\-?[0-9]+(e[0-9]+)?(\.[0-9]+)?$/.test(n);
export const isStr = str => typeof str === "string" || str instanceof String;
export const errorObj = (cmd, msg) => ({ cmd, msg });
