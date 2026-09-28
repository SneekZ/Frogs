import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Относительные пути: сборка работает по любому адресу (/, /frogs/ и т.п.) — роутера нет
  base: "./",
  plugins: [react()],
})
