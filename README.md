[![make.fun](https://make.fun/badge/news-image-20261127.svg)](https://make.fun/bounty/news-image-20261127)
[![Rank](https://make.fun/badge/news-image-20261127/tunnelmoon/news-image-20261127/rank.svg)](https://make.fun/bounty/news-image-20261127)
[![Reward](https://make.fun/badge/news-image-20261127/tunnelmoon/news-image-20261127/reward.svg)](https://make.fun/bounty/news-image-20261127)

# The Daily World - Friday 27 November 2026

A make.fun bounty entry for [news-image-20261127](https://make.fun/bounty/news-image-20261127): sum up 27 November's world news in one image.

`main.ts` (Node 22, standard library only) draws the whole newspaper front page in code, a deterministic PNG, and writes it to `(MAKEFUN_OUTPUT_DIR ?? "/output")/entry.png`. No network, no assets, no randomness: two runs write the same bytes.

The front page is dated Friday 27 November 2026 and leads with the day's big story, Black Friday, which falls on 27 November 2026, the day after Thanksgiving. A code-drawn storefront scene shows shoppers queuing before dawn under a "SALE UP TO 50% OFF" sign, with columns on Thanksgiving travel, online deals, and the world in brief: climate talks closing in Turkey, markets watching holiday spending, and football returning for the weekend.

Run it with:

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT. See [LICENSE](LICENSE).
