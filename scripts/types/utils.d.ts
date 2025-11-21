export type CSVRow = {
  line: number
  data: { [key: string]: string | string[] | boolean | number | null }
}
export type ImageProbeResult = {
  width: number
  height: number
  format: string
}
