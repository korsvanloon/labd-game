export const formatTime = (value: number) =>
  `${xx(Math.floor(value / 60))}:${xx(value % 60)}`

export const xx = (value: number) => value.toString().padStart(2, '0')
