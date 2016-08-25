mix deps.clean --all
mix deps.get

rm -rf apps/candle/custom_deps/bootstrap
rm -rf apps/candle/custom_deps/cyclic-router

cd apps/candle/custom_deps
git clone git@github.com:ntilwalli/bootstrap
cd bootstrap
git checkout tipjar
npm install
cd ..
git clone git@github.com:ntilwalli/cyclic-router
cd cyclic-router
npm install
npm run prerelease

cd ../..
npm install



