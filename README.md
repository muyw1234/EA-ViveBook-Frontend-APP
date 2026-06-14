# ViveBooks - Apartat de reptes

## Configuració de connexió

Les connexions HTTP i Socket.IO comparteixen la configuració definida a
`src/config/environment.ts`.

- Android Emulator utilitza per defecte `http://10.0.2.2:1337`.
- iOS Simulator i Web utilitzen per defecte `http://localhost:1337`.
- Un dispositiu físic o una build desplegada ha de definir `EXPO_PUBLIC_API_URL` i
  `EXPO_PUBLIC_SOCKET_URL`.

Es pot partir de `.env.example` per definir aquestes variables. En un dispositiu físic cal
utilitzar una adreça accessible des del dispositiu, no `localhost`.

Les respostes del Backend es normalitzen mitjançant `src/utils/apiResponse.ts`, que soporta
tant respostes directes com el contracte `{ success, status, message, data }`.

## Abast de l’exercici

En aquest exercici s’ha implementat una nova funcionalitat a l’aplicació **ViveBooks**: un apartat de **reptes** per als usuaris.

L’objectiu d’aquesta funcionalitat és motivar els usuaris a participar més activament dins de l’aplicació, proposant-los diferents objectius relacionats amb l’ús de la plataforma. Els reptes permeten a l’usuari veure el seu progrés, consultar el seu historial i saber quan ha completat cadascun dels objectius plantejats.

La idea desenvolupada és la següent:

> Com a usuari de ViveBooks, vull tenir un apartat de reptes amb objectius com comprar X llibres, llogar X llibres, assistir a X esdeveniments, rebre X valoracions o seguir X usuaris, per motivar-me a participar més en l’aplicació i seguir el meu progrés dins de la comunitat.

## Funcionalitats implementades

Actualment, l’exercici està completament operatiu i inclou les funcionalitats següents:

- S’ha creat un apartat específic de **reptes** dins de l’aplicació.
- Es mostren diferents reptes relacionats amb:

  - Comprar llibres.
  - Llogar llibres.
  - Assistir a esdeveniments.
  - Rebre valoracions.
  - Seguir usuaris.

- Cada repte mostra clarament quin és l’objectiu que l’usuari ha de complir.
- L’usuari pot veure el seu progrés en cada repte.
- Quan un repte arriba al seu objectiu, aquest apareix com a **completat**.
- L’usuari pot veure un historial dels reptes completats.
- S’ha afegit una targeta de felicitació que apareix quan l’usuari ha completat tots els reptes disponibles.

## Estat actual de l’exercici

L’estat actual de l’exercici és **funcional**. Les parts principals de la funcionalitat estan implementades i operatives.

L’usuari pot accedir a l’apartat de reptes, consultar els objectius disponibles, veure el seu progrés, revisar l’historial de reptes completats i comprovar quins reptes ha completat. A més, si completa tots els reptes, l’aplicació mostra un missatge de felicitació mitjançant una targeta especial.

## Parts operatives

Les parts que funcionen correctament són:

- Visualització de l’apartat de reptes.
- Visualització dels reptes disponibles.
- Mostra de l’objectiu de cada repte.
- Càlcul i visualització del progrés de l’usuari.
- Reptes relacionats amb la compra de llibres.
- Reptes relacionats amb el lloguer de llibres.
- Reptes relacionats amb l’assistència a esdeveniments.
- Reptes relacionats amb rebre valoracions.
- Reptes relacionats amb seguir usuaris.
- Marcatge automàtic dels reptes completats.
- Historial de reptes completats.
- Targeta de felicitació quan tots els reptes estan completats.

## Parts pendents de codificar

No hi ha parts principals pendents de codificar en relació amb l’abast plantejat inicialment.

Com a possibles millores futures, es podrien afegir:

- Més tipus de reptes.
- Diferents nivells de dificultat.
- Recompenses o insígnies per completar reptes.
- Notificacions quan l’usuari completi un repte.
- Creació de diferents nivells d’usuari, com **Bronze**, **Plata** i **Or**, en funció del nombre de reptes aconseguits.

## Ús de IA

Durant el desenvolupament de l’exercici s’ha utilitzat IA com a suport per a les tasques següents:

- Millorar la redacció i l’estructura d’aquest document README.
- Arreglar i millorar l’estètica de l’apartat de reptes.
- Arreglar i millorar l’estètica de la targeta de felicitació que apareix quan l’usuari completa tots els reptes.
