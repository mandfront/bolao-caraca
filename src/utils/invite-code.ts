const ADJECTIVES = ['Bravo', 'Gol', 'Copa', 'Arena', 'Ouro', 'Verde', 'Camisa', 'Bola', 'Campo', 'Craque']
const NOUNS = ['Rei', 'Fera', 'Top', 'Finca', 'Trave', 'Grito', 'Festa', 'Taca', 'Jogo', 'Penta']

export function generateInviteCode(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
  const num = Math.floor(Math.random() * 9000) + 1000
  return `${adj}${noun}${num}`
}
