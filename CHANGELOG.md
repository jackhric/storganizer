# Changelog

## [0.6.0](https://github.com/jackhric/storganizer/compare/storganizer-v0.5.0...storganizer-v0.6.0) (2026-06-06)


### Features

* **devices:** add editable per-device icons ([71628ce](https://github.com/jackhric/storganizer/commit/71628cea1a5396567ba4f288da3fe94c91f38a59))
* **items:** hover-reveal warning for unassigned items ([2aa641d](https://github.com/jackhric/storganizer/commit/2aa641d88b811bddc5665e228a405f711abe5e43))
* **search:** live LED preview of global search results ([0f7d443](https://github.com/jackhric/storganizer/commit/0f7d443ac8fff292e5774f9508f52d33dbaf50c3))
* **search:** show item tag dots in global search results ([27a442a](https://github.com/jackhric/storganizer/commit/27a442ad3da433a851425df63d9b142f9173076c))

## [0.5.0](https://github.com/jackhric/storganizer/compare/storganizer-v0.4.0...storganizer-v0.5.0) (2026-06-03)


### Features

* **assignments:** optimistic mutations, context menu, and drag-to-remove ([4cd12fe](https://github.com/jackhric/storganizer/commit/4cd12fe39ea4f161513ff44ab6f2ecb69fddf725))
* **docker:** add docker-compose.yml for one-command deploy ([e9f90d4](https://github.com/jackhric/storganizer/commit/e9f90d49323c5716ba3e5630b51ef1d095873ee6))
* **items:** add random items endpoint ([c7162f4](https://github.com/jackhric/storganizer/commit/c7162f4519430b0410683483ac4b9ddf9fdab996))
* **lighting:** configurable highlight color and effects for found items ([50fc7e9](https://github.com/jackhric/storganizer/commit/50fc7e9160ec22000b7a91a38fba2f7f5e20d715))
* **search:** wire global search to live results and selection ([696a31b](https://github.com/jackhric/storganizer/commit/696a31b7f495bbb6b3d91a049fbe3cea0212a004))
* **settings:** add global lighting settings table and REST API ([dab3cf7](https://github.com/jackhric/storganizer/commit/dab3cf796194efa5c5557ba88f63f16297f65f9f))
* **settings:** HSL accent picker with dark-mode auto-adjust ([c228d98](https://github.com/jackhric/storganizer/commit/c228d98ae2faae1fb5a84a256ecd8b79df61ba8f))


### Bug Fixes

* **images:** cache-bust item images with updated_at version ([0772625](https://github.com/jackhric/storganizer/commit/0772625c178ab3444423b6497a03d7f8aa12dbe7))
* **readme:** point version badge at GitHub Releases ([e00b6ee](https://github.com/jackhric/storganizer/commit/e00b6ee34fb53027e4e02b9d76c0568aee603b54))
* **readme:** replace broken license badge with static AGPL 3.0 ([8f38e62](https://github.com/jackhric/storganizer/commit/8f38e62468e489f0457dbb517d8d1d4de32fe415))

## [0.4.0](https://github.com/jackhric/storganizer/compare/storganizer-v0.3.0...storganizer-v0.4.0) (2026-06-02)


### Features

* trigger release to verify docker publish wiring ([a7d9c0a](https://github.com/jackhric/storganizer/commit/a7d9c0a2ade43e6d99a774a2cb61ca41d2fd6c68))

## [0.3.0](https://github.com/jackhric/storganizer/compare/storganizer-v0.2.0...storganizer-v0.3.0) (2026-06-02)


### Features

* **assignments:** drag occupied cells to move or swap ([fee1049](https://github.com/jackhric/storganizer/commit/fee104970a6d40ac4ba5a18acda88bc29ae64b73))
* **assignments:** drag-and-drop assignments with live WLED feedback ([bab50a3](https://github.com/jackhric/storganizer/commit/bab50a3093f49f2d1f13f9a73773759bd4faa98b))
* **assignments:** scaffold item-to-cell assignment UI ([459c835](https://github.com/jackhric/storganizer/commit/459c83582f05f4f5a529326d2fc1c2709f49abff))
* **cells:** auto-sync cells from device led_count ([a59f82f](https://github.com/jackhric/storganizer/commit/a59f82fc3521a95d2f16d73a8e4c88b35f072b35))
* **components:** add dropzone, multi-select filter, and device filter ([9e3eda8](https://github.com/jackhric/storganizer/commit/9e3eda80a163fefbfd89b8a659434fb28fca0bfe))
* **devices:** add manual refresh endpoint and UI button ([12fbd94](https://github.com/jackhric/storganizer/commit/12fbd94c2a2828f468ee99db74243a95818fd36c))
* **docker:** add single-image build of server + static web bundle ([6d7efe5](https://github.com/jackhric/storganizer/commit/6d7efe580954ee2e78b6aa7e418c66f1b2c94eab))
* **dropzone:** accept pasted images from the clipboard ([0f2e1fc](https://github.com/jackhric/storganizer/commit/0f2e1fc80f81c86531f58504538d3c5a3628e85d))
* **highlight:** switch Find to WARLS via global useWarls hook ([e1a43c4](https://github.com/jackhric/storganizer/commit/e1a43c4eef44553659fda28b16ccd7a22e661aa3))
* **items:** flag unassigned items and redesign card actions ([bb5ce41](https://github.com/jackhric/storganizer/commit/bb5ce416ef50bd758148b9126721e2731e4e1b57))
* **items:** make whole card trigger find, add spring animations ([1e40de7](https://github.com/jackhric/storganizer/commit/1e40de7ac636e6ea8692357dc1861d664fcccb4a))
* **items:** multi-select find with selection bar and popover ([2a787a7](https://github.com/jackhric/storganizer/commit/2a787a7b59682ff11147351a596fb5d1fa63d52c))
* **items:** multi-tag/device filtering and tag-dot card overlay ([a09314e](https://github.com/jackhric/storganizer/commit/a09314e443613280b1e2b501f1b2adf9aa07925f))
* **items:** redesign card as 1:1 cell with overlay info and find indicator ([013bad1](https://github.com/jackhric/storganizer/commit/013bad1c417af62263543f1e8d98b716e8ef2e63))
* **logo:** add spring hover/tap animation ([091490c](https://github.com/jackhric/storganizer/commit/091490ce71e8cdce22886d3d2f1dbe199294074d))
* **settings:** add credits & licenses page ([d515a15](https://github.com/jackhric/storganizer/commit/d515a15160876b6bc0783ec75663df38c9484fe8))
* **settings:** regroup general page and add selection border style ([b758618](https://github.com/jackhric/storganizer/commit/b758618df9a95779ea88dd6504bc17f92a36277f))
* **sidebar:** add animated grid background with frosted nav items ([dab3aaf](https://github.com/jackhric/storganizer/commit/dab3aafa909a1a5f68ab208f6a7fc2f402b93028))
* **tags:** add bulk apply/remove/merge endpoints ([d09dd32](https://github.com/jackhric/storganizer/commit/d09dd323936f52881387073eae22ff03a6d90a4e))
* **tags:** add tags collection module with migrations ([943434f](https://github.com/jackhric/storganizer/commit/943434f1e720e6a1089314fa60f47b8b260cc347))
* **tags:** add tags feature with color dots, input, and filter ([c76d8a2](https://github.com/jackhric/storganizer/commit/c76d8a2fe2bcdf9a116133efdc93dbfd9e6dac54))
* **tags:** add tags management page with batch apply/remove/merge ([f065b5d](https://github.com/jackhric/storganizer/commit/f065b5da0e7465b06800d345513b5514e6e8fc85))
* **tags:** convert tags to relation with cascade delete ([fa62e21](https://github.com/jackhric/storganizer/commit/fa62e21c87c14ee7f40ad68a96f1d7dc6817ba7f))
* **web:** static export served by FastAPI for single-origin deploys ([624858e](https://github.com/jackhric/storganizer/commit/624858e61623ca503b89a56b63ddc9d70e0fbf2a))


### Bug Fixes

* **cells:** make led_index non-nullable ([e97b254](https://github.com/jackhric/storganizer/commit/e97b2547efb447e36d227f9a0b6fb34b824d1dc0))
* **wled:** correct matrix JSON keys to w/h ([cb6e18b](https://github.com/jackhric/storganizer/commit/cb6e18b3ac1be5d8c1c90ac740f9a61aaccf550a))
