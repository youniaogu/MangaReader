interface String {
  prefix(pre: string): string;
}

String.prototype.prefix = function (pre: string) {
  return pre + this;
};
