import fs from "fs";
import path from "path";

let ok = true;
function check(label, pass) {
  if (!pass) {
    console.error(`FAIL: ${label}`);
    ok = false;
  }
}

const indexHtml = fs.readFileSync("index.html", "utf8");
check("viewport-fit=cover in index.html", indexHtml.includes("viewport-fit=cover"));

const globalCss = fs.readFileSync("src/styles/global.css", "utf8");
check("overscroll-behavior in global.css", globalCss.includes("overscroll-behavior"));

const tokensCss = fs.readFileSync("src/styles/tokens.css", "utf8");
check("safe-area-inset-top variable in tokens.css", tokensCss.includes("safe-area-inset-top"));
check("safe-area-inset-bottom variable in tokens.css", tokensCss.includes("safe-area-inset-bottom"));

const ledgerCss = fs.readFileSync("src/styles/ledger.css", "utf8");
check("safe-top in ldg-content padding", ledgerCss.includes("--safe-top"));
check("overscroll-behavior-y in ledger.css", ledgerCss.includes("overscroll-behavior-y"));
check("swipe-row overflow hidden", ledgerCss.includes("overflow: hidden") && ledgerCss.includes("swipe-row"));
check("swipe-row-action visibility hidden", ledgerCss.includes("visibility: hidden"));

const tabbarCss = fs.readFileSync("src/styles/tabbar.css", "utf8");
check("safe-area-inset-bottom in tabbar", tabbarCss.includes("safe-area-inset-bottom"));

const walletNameLib = fs.readFileSync("src/lib/walletName.ts", "utf8");
check("walletName localStorage key", walletNameLib.includes("myledger.walletName.v1"));

const settingsPage = fs.readFileSync("src/components/settings/SettingsPage.tsx", "utf8");
check("wallet name UI in SettingsPage", settingsPage.includes("지갑 이름"));
check("BackupRestoreCard in SettingsPage", settingsPage.includes("BackupRestoreCard"));
check("AppLockSettings in SettingsPage", settingsPage.includes("AppLockSettings"));

const homePage = fs.readFileSync("src/components/home/HomePage.tsx", "utf8");
check("walletName in HomePage", homePage.includes("walletName"));

const ledgerHeader = fs.readFileSync("src/components/home/LedgerHeader.tsx", "utf8");
check("walletName prop in LedgerHeader", ledgerHeader.includes("walletName"));

const swipeableRow = fs.readFileSync("src/components/transaction/SwipeableRow.tsx", "utf8");
check("swiping class in SwipeableRow", swipeableRow.includes("swiping"));

if (ok) {
  console.log("verify:mobile passed");
} else {
  process.exit(1);
}
