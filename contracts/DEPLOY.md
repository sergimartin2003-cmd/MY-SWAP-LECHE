# Deploying NexSwapRouter

El contrato `NexSwapRouter.sol` es autocontenido — no necesita npm ni Hardhat.
Despliégalo en **Remix IDE** (navegador) en 5 minutos.

---

## 1. Abrir Remix

Ve a **https://remix.ethereum.org**

---

## 2. Crear el archivo

1. En el panel izquierdo, pulsa el icono de archivos
2. Crea un nuevo archivo: `NexSwapRouter.sol`
3. Pega todo el contenido de este directorio (`contracts/NexSwapRouter.sol`)

---

## 3. Compilar

1. Pestaña **Solidity Compiler** (icono `<S>`)
2. Compiler version: **0.8.24** (o cualquier `^0.8.24`)
3. Pulsa **Compile NexSwapRouter.sol**
4. Debe aparecer un tick verde ✓

---

## 4. Desplegar

1. Pestaña **Deploy & Run Transactions** (icono de cohete 🚀)
2. Environment: **Injected Provider — MetaMask**
3. Asegúrate de estar en la red correcta en MetaMask
4. En el campo **Contract** selecciona `NexSwapRouter`
5. Expande el campo de constructor y rellena los 3 parámetros:

### Ethereum Mainnet
| Parámetro  | Valor |
|-----------|-------|
| `_router`   | `0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45` |
| `_weth`     | `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2` |
| `_treasury` | **tu dirección de wallet** (p.ej. `0xTuWallet...`) |

### Base
| Parámetro  | Valor |
|-----------|-------|
| `_router`   | `0x2626664c2603336E57B271c5C0b26F421741e481` |
| `_weth`     | `0x4200000000000000000000000000000000000006` |
| `_treasury` | **tu dirección de wallet** |

### Arbitrum / Optimism
| Parámetro  | Valor |
|-----------|-------|
| `_router`   | `0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45` |
| `_weth`     | `0x82aF49447D8a07e3bd95BD0d56f35241523fBab1` (Arbitrum) / `0x4200000000000000000000000000000000000006` (Optimism) |
| `_treasury` | **tu dirección de wallet** |

6. Pulsa **Deploy** → confirma en MetaMask (~$5-15 de gas en mainnet, centavos en L2)
7. Copia la dirección del contrato desplegado (aparece en "Deployed Contracts")

---

## 5. Verificar en Etherscan (opcional pero recomendado)

Para que los usuarios puedan leer el contrato públicamente:

1. Ve a **etherscan.io** (o arbiscan, basescan, etc.)
2. Busca la dirección del contrato
3. Pestaña **Contract → Verify and Publish**
4. Compiler: `v0.8.24`, License: MIT, Single file
5. Pega el código fuente → Submit

---

## 6. Conectar al frontend

Una vez desplegado, añade las direcciones en **Vercel** (o `.env.local`):

```
VITE_NEXSWAP_ROUTER_MAINNET=0x<dirección en mainnet>
VITE_NEXSWAP_ROUTER_BASE=0x<dirección en base>
VITE_NEXSWAP_ROUTER_ARBITRUM=0x<dirección en arbitrum>
VITE_NEXSWAP_ROUTER_OPTIMISM=0x<dirección en optimism>
VITE_TREASURY_ADDRESS=0x<tu wallet>
```

El frontend ya está preparado para usar el router automáticamente cuando las variables estén configuradas.
Sin las variables, los swaps siguen funcionando directamente via Uniswap (sin cobrar fees on-chain).

---

## Cómo funcionan los fees

```
Usuario envía 1 ETH
  → NexSwapRouter toma 0.0025 ETH (0.25%) → treasury (tu wallet)
  → 0.9975 ETH pasan a Uniswap v3
  → Usuario recibe ~X USDC
```

- Fee en ETH/native → llega a tu wallet en ETH
- Fee en ERC-20 → llega a tu wallet en ese token
- Puedes cambiar el fee (máx 1%) con `setFeeBps(n)` desde el owner
- Puedes cambiar la treasury con `setTreasury(addr)` desde el owner

---

## Seguridad

- ✅ Reentrancy guard manual (sin dependencias)
- ✅ Deadline check (protección MEV)
- ✅ Fee cap hardcodeado al 1% (no puedes cobrar más aunque quieras)
- ✅ Reset-approve para tokens USDT-style
- ✅ `rescueTokens` / `rescueETH` si alguien manda tokens por error
- ✅ `receive()` solo acepta ETH de WETH (rechaza envíos directos accidentales)
- ⚠️ **Audita el contrato antes de manejar grandes volúmenes**
