import '@fontsource-variable/jetbrains-mono';
import '@fontsource-variable/playfair-display';
import '@fontsource-variable/source-sans-3';
import { mount } from 'svelte';
import App from './App.svelte';
import './app.css';

mount(App, { target: document.getElementById('app')! });
