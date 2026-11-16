#!/usr/bin/env node
import path from 'node:path';
import http from 'node:http';
import { readFolder } from './files.js';
import { terminal } from './terminal.js';
import html from 'smudge:page';

const terminalMode = process.argv.includes('--terminal');
const args = process.argv.slice(2).filter(arg => arg !== '--terminal');
const text = readFolder(path.resolve(args[0] || '.'));

if (terminalMode) {
  terminal(text);
} else {
  http.createServer((request, response) => {
    response.setHeader('Content-Type', request.url === '/text' ? 'text/plain; charset=utf-8' : 'text/html; charset=utf-8');
    response.end(request.url === '/text' ? text : html);
  }).listen(args[1] || 3000, process.env.HOST || '127.0.0.1', function () {
    console.log(`Screen Smudge Test: http://${this.address().address}:${this.address().port}`);
  });
}
