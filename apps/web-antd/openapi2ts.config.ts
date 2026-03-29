// import { generateService } from '@umijs/openapi'
import path from 'path'

export default({
  requestLibPath: "import {request} from '@/api/request'",
  // requestFunctionName: 'requestClient', 
  schemaPath: path.resolve(__dirname, './openapi.json'),
  serversPath: path.resolve(__dirname, 'src/services'),
})

