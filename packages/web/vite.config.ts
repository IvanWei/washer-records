import { UserConfigExport, ServerOptions } from 'vite'
import react from '@vitejs/plugin-react'
import { certificateFor } from 'devcert'

// https://vitejs.dev/config/
export default async (): Promise<UserConfigExport> => {
  let server: ServerOptions = {port: 8000}
  if (process.env.HTTPS === 'true') {
    const { key, cert } = await certificateFor('localhost')
    server = {
      https: {
        key,
        cert,
      },
    }
  }

  return {
    plugins: [react()],
    server,
  }
}
