// SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me>
// SPDX-License-Identifier: GPL-3.0-or-later

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const [asset, mode] = process.argv.slice(2);
const values = new Map([['sidebar-scroll', '87']]);
const scrolled = [], toggled = [];
let registered;
let toggle;
class Element {
  constructor() { this.listeners = new Map(); this.scrollTop = 0; }
  querySelectorAll() { return []; }
  addEventListener(name, listener) { this.listeners.set(name, listener); }
}
const context = {
  HTMLElement: Element,
  document: {
    location: {href:'https://example.test/index.html'},
    querySelector: () => ({scrollIntoView: options => scrolled.push(options)}),
    querySelectorAll: () => [{
      addEventListener: (name, listener) => { toggle = listener; },
    }],
  },
  window: {customElements:{define:(name, constructor) => {
    assert.equal(name,'mdbook-sidebar-scrollbox');
    registered = constructor;
  }}},
};
const denied = () => { throw new Error('Storage denied'); };
const storage = {
  getItem: key => values.get(key) ?? null,
  setItem: (key, value) => values.set(key,String(value)),
  removeItem: key => values.delete(key),
};
if (mode === 'getter-denied') Object.defineProperty(context,'sessionStorage',{get:denied});
else if (mode === 'methods-denied') context.sessionStorage = {getItem:denied,setItem:denied,removeItem:denied};
else if (mode === 'write-denied') context.sessionStorage = {...storage,setItem:denied};
else context.sessionStorage = storage;

vm.runInNewContext(fs.readFileSync(asset,'utf8'),context,{filename:asset});
const sidebar = new registered();
sidebar.connectedCallback();
assert.match(sidebar.innerHTML, /<ol class="chapter">/);
if (mode === 'getter-denied' || mode === 'methods-denied') {
  assert.equal(sidebar.scrollTop,0);
  assert.equal(JSON.stringify(scrolled),JSON.stringify([{block:'center'}]));
} else {
  assert.equal(sidebar.scrollTop,'87');
  assert.equal(values.has('sidebar-scroll'),false);
}
sidebar.scrollTop = 104;
sidebar.listeners.get('click').call(sidebar,{target:{tagName:'A'}});
toggle({currentTarget:{parentElement:{classList:{toggle:value => toggled.push(value)}}}});
assert.deepEqual(toggled,['expanded']);
if (mode === 'available') assert.equal(values.get('sidebar-scroll'),'104');
else assert.equal(values.has('sidebar-scroll'),mode !== 'write-denied');
console.log(`Sidebar initialization and navigation pass: ${mode}`);
