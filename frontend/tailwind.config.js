/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html','./src/**/*.{js,jsx}'],
  theme: {extend: {
    colors: {ink:'#162a28',forest:'#153b32',pine:'#245a47',leaf:'#4d8a58',sage:'#e3efe0',cream:'#f7f8f2',muted:'#7b8e86'},
    fontFamily: {sans:['Inter','ui-sans-serif','system-ui']}
  }},
  plugins: []
}
