import { Storage, File } from '@freearhey/core'
import { DATA_DIR, API_DIR } from '../constants'
import { CSVParser } from '../core'

async function main() {
  const dataStorage = new Storage(DATA_DIR)
  const apiStorage = new Storage(API_DIR)
  const parser = new CSVParser()

  const files = await dataStorage.list('*.csv')
  for (const filepath of files) {
    const file = new File(filepath)
    const filename = file.name()
    const data = await dataStorage.load(file.basename())
    const items = await parser.parse(data)

    await apiStorage.save(`${filename}.json`, items.toJSON())
  }
}

main()
