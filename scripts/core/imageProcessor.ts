import { ImageProcessorProbeResult } from '../types/imageProcessor'
import { getFileExtension } from '../utils'
import { TESTING } from '../constants'
import probe from 'probe-image-size'

const formatsByMimeType: { [key: string]: string } = {
  'image/svg+xml': 'SVG',
  'image/png': 'PNG',
  'image/jpeg': 'JPEG',
  'image/gif': 'GIF',
  'image/webp': 'WebP',
  'image/avif': 'AVIF',
  'image/apng': 'APNG'
}
const formatsByExtension: { [key: string]: string } = {
  svg: 'SVG',
  png: 'PNG',
  jpeg: 'JPEG',
  jpg: 'JPEG',
  gif: 'GIF',
  webp: 'WebP',
  avif: 'AVIF',
  apng: 'APNG'
}

export class ImageProcessor {
  async probe(url: string): Promise<ImageProcessorProbeResult> {
    let width = 0
    let height = 0
    let format = ''

    if (TESTING) {
      return {
        width: 80,
        height: 80,
        format: 'JPEG'
      }
    } else {
      const imageInfo = await probe(url).catch(() => {})

      if (imageInfo) {
        width = Math.round(imageInfo.width)
        height = Math.round(imageInfo.height)
        format = formatsByMimeType[imageInfo.mime]
      }

      if (!format) {
        const extension = getFileExtension(url)
        format = formatsByExtension[extension]
      }

      return {
        width,
        height,
        format
      }
    }
  }
}
