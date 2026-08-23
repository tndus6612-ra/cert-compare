import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/cert-compare/',
  plugins: [react(), tailwindcss()],
  build: {
    // 국기 SVG는 내부에 url(#id) 참조(clipPath 등)가 있어서, Vite가 이를
    // data URI로 인라인하면 CSS의 바깥쪽 url(...)이 그 안의 )에서 잘못 끊긴다.
    // 별도 파일로 유지해서 이 문제를 피한다.
    assetsInlineLimit: 0,
  },
})
