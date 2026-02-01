# Accessible Jupyter Notebooks via Screen Reader

## The Problem

There is no currently reliably accessible solution for using Jupyter notebooks with screen readers. VSCode has some support, but it is flakey at best. Google Colab pretends to be accessible, but the interface makes no sense via screen reader.

## This Project

This project will create a browser-based accessible solution for Jupyter notebooks.

### Approach

- Learn how Jupyter notebooks work
- First attempt: a simple browser based solution
  - Run server locally
  - Simple interface with basic styling and as few keyboard shortcuts as possible
  - Communicate with local Python server to run cells and display output

### Goals

1. **Accessibility First**: Built specifically for screen reader users
2. **Simple Interface**: Minimal keyboard shortcuts, clear navigation
3. **Standard Technologies**: Browser-based, no complex setup required
