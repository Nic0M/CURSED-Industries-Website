## Website URL
[https://cursedindustries.com](https://cursedindustries.com)
## Updating the Website
### Connecting to Website Server
Make sure you have an SSH key setup
```shell
ssh bitnami@<ip_address>
```
### Getting to Git Repository
Change into the git repository
```shell
cd /bitnami/wordpress
```
Checkout master branch
```shell
git checkout master
```
### Save or Delete Old Changes on Website
Either stash current changes to save changes on the website
```shell
git stash
```
or remove all local changes on the website (REMOVES ALL UNSAVED CHANGES ON THE SERVER)
```shell
git reset --hard HEAD
```
### Get New Changes
Pull changes from this repository
```shell
git pull origin master
```
Enter your username and a personal access token for the password.

If successful, you should see something like this
```
 * branch            master     -> FETCH_HEAD
Updating <commit hash>
Fast-forward
 <filename> | 8 ++++++--
 1 file changed, 6 insertions(+), 2 deletions(-)
```
### Restoring Stashed Changes
If changes were stashed use
```shell
git stash pop
```

## Minifying JS
```shell
./wp-content/themes/astra-child-theme/assets/js/closure-compiler/minify_js.sh 
```

## Minifying CSS
```shell
sudo apt install npm
npm install --global gulp-cli
npm init -y
npm install --save-dev gulp
npm install --save-dev gulp-sass
npm install --save-dev sass
npm install --save-dev gulp-clean-css
npm install --save-dev gulp-rename
npm install --save-dev gulp-concat
npm install --save-dev google-closure-compiler
npm install --save-dev gulp-closure-compiler
npm install --save-dev concat   
vim gulpfile.js
```

```shell
gulp default
```