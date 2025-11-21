import { Storage, File } from '@freearhey/storage-js'
import { DATA_DIR, API_DIR } from '../../constants'
import { CSVRow } from '../../types/utils'
import { parseCSV } from '../../core'

async function main() {
  const dataStorage = new Storage(DATA_DIR)
  const apiStorage = new Storage(API_DIR)

  const files = await dataStorage.list('*.csv')
  for (const filepath of files) {
    const file = new File(filepath)
    const filename = file.name()
    const data = await dataStorage.load(file.basename())
    const parsed = await parseCSV(data)
    const items = parsed.map((row: CSVRow) => row.data)

    await apiStorage.save(`${filename}.json`, items.toJSON())
  }
}

main()
