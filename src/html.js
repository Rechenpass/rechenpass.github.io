// Zentrale htm-Bindung an Preact – überall importieren, damit es nur EINE Bindung gibt.
import { h } from 'preact';
import htm from 'htm';

export const html = htm.bind(h);
