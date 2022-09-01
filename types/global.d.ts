declare namespace globalThis {
  interface JSON {
    parseJSON(text: string): any
  }
}