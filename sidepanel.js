const defaults = {
  purchaseCost: 20,
  shippingFee: 4,
  freightInsurance: 2,
  returnRate: 50,
  targetProfit: 5,
  customDiscount: 10,
  promotionRoi: 0,
};

const ids = Object.keys(defaults);
let pddDiscountValue = defaults.customDiscount;
let douyinCouponValue = 25;
const money = new Intl.NumberFormat("zh-CN", {
  style: "currency",
  currency: "CNY",
  minimumFractionDigits: 2,
});
const percent = new Intl.NumberFormat("zh-CN", {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function numberValue(id) {
  const value = Number(document.getElementById(id).value);
  return Number.isFinite(value) ? value : 0;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function roundUpCent(value) {
  return Math.ceil(value * 100) / 100;
}

function safeRatio(numerator, denominator) {
  return denominator > 0 ? numerator / denominator : 0;
}

function formatRatio(value) {
  return Number.isFinite(value) ? value.toFixed(2) : "0.00";
}

function getDiscountForCalculation() {
  const input = document.getElementById("customDiscount");
  const value = Number(input.value);
  if (!Number.isFinite(value) || input.value === "") {
    return 1;
  }

  return clamp(value, 1, 10);
}

function currentPlatform() {
  const active = document.querySelector(".logic-tab.active");
  return active?.dataset.platform === "douyin" ? "douyin" : "pdd";
}

function currentCouponAmount() {
  return currentPlatform() === "douyin" ? Math.max(numberValue("customDiscount"), 0) : douyinCouponValue;
}

function activePddDiscount() {
  return currentPlatform() === "pdd" ? getDiscountForCalculation() : clamp(Number(pddDiscountValue), 1, 10);
}

function savePlatformInputValue() {
  if (currentPlatform() === "douyin") {
    douyinCouponValue = Math.max(numberValue("customDiscount"), 0);
  } else {
    pddDiscountValue = getDiscountForCalculation();
  }
}

function syncPlatformField() {
  const platform = currentPlatform();
  const input = document.getElementById("customDiscount");
  const label = document.getElementById("pricingAdjustmentLabel");
  const unit = document.getElementById("pricingAdjustmentUnit");

  if (platform === "douyin") {
    label.textContent = "优惠券金额";
    unit.textContent = "元";
    input.min = "0";
    input.removeAttribute("max");
    input.step = "0.1";
    input.value = String(douyinCouponValue);
  } else {
    label.textContent = "自定义成交折扣";
    unit.textContent = "折";
    input.min = "1";
    input.max = "10";
    input.step = "0.1";
    input.value = String(pddDiscountValue);
  }
}

function normalizeDiscountInput() {
  if (currentPlatform() === "douyin") {
    const input = document.getElementById("customDiscount");
    const value = Math.max(numberValue("customDiscount"), 0);
    input.value = String(value);
    douyinCouponValue = value;
    return value;
  }

  const input = document.getElementById("customDiscount");
  const value = Number(input.value);
  const normalized = Number.isFinite(value) && input.value !== "" ? clamp(value, 1, 10) : 1;
  if (normalized !== value) {
    input.value = String(normalized);
  }
  return normalized;
}

function discountLabel(discount) {
  return discount === 10 ? "不打折" : `${discount} 折`;
}

function currentProfitMode() {
  const active = document.querySelector(".mini-tab.active");
  return active?.dataset.profitMode === "percent" ? "percent" : "fixed";
}

function targetProfitValue(purchaseCost) {
  const rawValue = numberValue("targetProfit");
  return currentProfitMode() === "percent" ? purchaseCost * rawValue / 100 : rawValue;
}

function syncTargetProfitMode() {
  const mode = currentProfitMode();
  const unit = document.getElementById("targetProfitUnit");
  const input = document.getElementById("targetProfit");

  unit.textContent = mode === "percent" ? "%" : "元";
  input.step = mode === "percent" ? "1" : "0.1";
}

function calculate() {
  const purchaseCost = numberValue("purchaseCost");
  const shippingFee = numberValue("shippingFee");
  const freightInsurance = numberValue("freightInsurance");
  const targetProfit = targetProfitValue(purchaseCost);
  const returnRatePercent = numberValue("returnRate");
  if (currentPlatform() === "douyin") {
    douyinCouponValue = currentCouponAmount();
  } else {
    pddDiscountValue = getDiscountForCalculation();
  }

  const customDiscount = activePddDiscount();
  const promotionEnabled = document.getElementById("promotionSwitch").checked;
  const promotionRoi = promotionEnabled ? Math.max(numberValue("promotionRoi"), 1.01) : 0;

  const returnRate = clamp(returnRatePercent / 100, 0, 0.99);
  const fixedOrderLoss = shippingFee + freightInsurance;
  const returnOrdersPerKeptOrder = returnRate / (1 - returnRate);
  const returnLossShare = returnOrdersPerKeptOrder * fixedOrderLoss;
  const baseCost = purchaseCost + fixedOrderLoss + returnLossShare;

  const promotionDivisor = promotionEnabled ? 1 - 1 / promotionRoi : 1;
  const breakEvenDealPrice = baseCost / promotionDivisor;
  const profitDealPrice = (baseCost + targetProfit) / promotionDivisor;
  const promotionCost = promotionEnabled ? breakEvenDealPrice / promotionRoi : 0;
  const discountRate = customDiscount / 10;
  const breakEvenListingPrice = roundUpCent(breakEvenDealPrice / discountRate);
  const profitListingPrice = roundUpCent(profitDealPrice / discountRate);

  syncTargetProfitMode();
  document.getElementById("breakEvenListingPrice").textContent = money.format(breakEvenListingPrice);
  document.getElementById("profitListingPrice").textContent = money.format(profitListingPrice);
  document.getElementById("breakEvenListingHint").textContent = `按${discountLabel(customDiscount)}反推`;
  document.getElementById("profitListingHint").textContent = `按${discountLabel(customDiscount)}反推，利润 ${money.format(targetProfit)}`;
  document.getElementById("breakEvenDealPrice").textContent = money.format(breakEvenDealPrice);
  document.getElementById("profitDealPrice").textContent = money.format(profitDealPrice);
  document.getElementById("profitHint").textContent = `已包含目标利润 ${money.format(targetProfit)}。`;
  document.getElementById("fixedOrderLoss").textContent = money.format(fixedOrderLoss);
  document.getElementById("returnOrdersPerKeptOrder").textContent = `${returnOrdersPerKeptOrder.toFixed(2)} 单`;
  document.getElementById("returnLossShare").textContent = money.format(returnLossShare);
  document.getElementById("baseCost").textContent = money.format(baseCost);
  document.getElementById("promotionCost").textContent = money.format(promotionCost);

  const promotionNotice = document.getElementById("promotionNotice");
  promotionNotice.classList.toggle("hidden", !promotionEnabled);
  promotionNotice.textContent = promotionEnabled
    ? `已计入推广成本：当前 ROI ${promotionRoi.toFixed(2)}，每单推广成本约 ${money.format(promotionCost)}。`
    : "";

  document.getElementById("breakEvenFormula").textContent =
    promotionEnabled
      ? `(${purchaseCost.toFixed(2)} 拿货 + ${fixedOrderLoss.toFixed(2)} 运费险 + ${returnLossShare.toFixed(2)} 退货摊销) ÷ (1 - 1 / ${promotionRoi.toFixed(2)}) = ${money.format(breakEvenDealPrice)}`
      : `${purchaseCost.toFixed(2)} 拿货 + ${fixedOrderLoss.toFixed(2)} 运费险 + ${returnLossShare.toFixed(2)} 退货摊销 = ${money.format(breakEvenDealPrice)}`;
  document.getElementById("profitFormula").textContent =
    promotionEnabled
      ? `(${baseCost.toFixed(2)} 基础成本 + ${targetProfit.toFixed(2)} 利润) ÷ (1 - 1 / ${promotionRoi.toFixed(2)}) = ${money.format(profitDealPrice)}`
      : `${breakEvenDealPrice.toFixed(2)} 不亏本成交价 + ${targetProfit.toFixed(2)} 利润 = ${money.format(profitDealPrice)}`;

  calculateRevisedLogic({
    profitDealPrice,
    targetProfit,
    returnRate,
    customDiscount,
  });
  calculateDouyinLogic({ targetProfit, returnRate });
}

function calculateRevisedLogic({ profitDealPrice, targetProfit, returnRate, customDiscount }) {
  const signedRate = 1 - returnRate;
  const discountRate = customDiscount / 10;
  const purchaseCost = numberValue("purchaseCost");
  const shippingFee = numberValue("shippingFee");
  const freightInsurance = numberValue("freightInsurance");
  const promotionEnabled = document.getElementById("promotionSwitch").checked;
  const promotionRoi = promotionEnabled ? Math.max(numberValue("promotionRoi"), 1.01) : 0;
  const fixedOrderLoss = shippingFee + freightInsurance;
  const returnLossShare = safeRatio(returnRate, signedRate) * fixedOrderLoss;
  const baseCost = purchaseCost + fixedOrderLoss + returnLossShare;
  const promotionDivisor = promotionEnabled ? 1 - 1 / promotionRoi : 1;

  const noPromotionBreakEvenDealPrice = baseCost;
  const noPromotionProfitDealPrice = baseCost + targetProfit;
  const promotionBreakEvenDealPrice = baseCost / promotionDivisor;
  const promotionProfitDealPrice = (baseCost + targetProfit) / promotionDivisor;
  const noPromotionBreakEvenListingPrice = roundUpCent(safeRatio(noPromotionBreakEvenDealPrice, discountRate));
  const noPromotionProfitListingPrice = roundUpCent(safeRatio(noPromotionProfitDealPrice, discountRate));
  const promotionBreakEvenListingPrice = roundUpCent(safeRatio(promotionBreakEvenDealPrice, discountRate));
  const promotionProfitListingPrice = roundUpCent(safeRatio(promotionProfitDealPrice, discountRate));

  const grossMarginRate = safeRatio(targetProfit, profitDealPrice);
  const breakEvenRoi = safeRatio(profitDealPrice, targetProfit);
  const flatRoi = safeRatio(breakEvenRoi, signedRate);
  const profitMultiplier = grossMarginRate < 0.3 ? 1.4 : 2;
  const bestProfitRoi = flatRoi * profitMultiplier;
  const breakEvenBid = targetProfit * signedRate;

  document.getElementById("noPromotionBreakEvenListingPrice").textContent = money.format(noPromotionBreakEvenListingPrice);
  document.getElementById("noPromotionBreakEvenDealPrice").textContent = `最终成交价 ${money.format(noPromotionBreakEvenDealPrice)}`;
  document.getElementById("noPromotionProfitListingPrice").textContent = money.format(noPromotionProfitListingPrice);
  document.getElementById("noPromotionProfitDealPrice").textContent = `最终成交价 ${money.format(noPromotionProfitDealPrice)}`;
  document.getElementById("promotionBreakEvenListingPrice").textContent = money.format(promotionBreakEvenListingPrice);
  document.getElementById("promotionBreakEvenDealPrice").textContent = `最终成交价 ${money.format(promotionBreakEvenDealPrice)}`;
  document.getElementById("promotionProfitListingPrice").textContent = money.format(promotionProfitListingPrice);
  document.getElementById("promotionProfitDealPrice").textContent = `最终成交价 ${money.format(promotionProfitDealPrice)}`;
  document.querySelectorAll(".promotion-only").forEach((element) => {
    element.classList.toggle("hidden", !promotionEnabled);
  });
  document.getElementById("revisedDiscountRate").textContent = percent.format(discountRate);
  document.getElementById("noPromotionBreakEvenDealLine").textContent = money.format(noPromotionBreakEvenDealPrice);
  document.getElementById("noPromotionProfitDealLine").textContent = money.format(noPromotionProfitDealPrice);
  document.getElementById("promotionBreakEvenDealLine").textContent = money.format(promotionBreakEvenDealPrice);
  document.getElementById("promotionProfitDealLine").textContent = money.format(promotionProfitDealPrice);
  document.getElementById("bestProfitRoi").textContent = formatRatio(bestProfitRoi);
  document.getElementById("breakEvenBid").textContent = money.format(breakEvenBid);
  document.getElementById("grossMarginRate").textContent = percent.format(grossMarginRate);
  document.getElementById("flatRoi").textContent = formatRatio(flatRoi);
  document.getElementById("breakEvenRoi").textContent = formatRatio(breakEvenRoi);

  document.getElementById("breakEvenPricingFormula").textContent =
    `不推广：${money.format(noPromotionBreakEvenDealPrice)} 最终成交价 ÷ ${percent.format(discountRate)} 成交折扣 = ${money.format(noPromotionBreakEvenListingPrice)} 拼单价。推广：${money.format(promotionBreakEvenDealPrice)} 最终成交价 ÷ ${percent.format(discountRate)} 成交折扣 = ${money.format(promotionBreakEvenListingPrice)} 拼单价。`;
  document.getElementById("profitPricingFormula").textContent =
    `不推广：${money.format(noPromotionProfitDealPrice)} 最终成交价 ÷ ${percent.format(discountRate)} 成交折扣 = ${money.format(noPromotionProfitListingPrice)} 拼单价。推广：${money.format(promotionProfitDealPrice)} 最终成交价 ÷ ${percent.format(discountRate)} 成交折扣 = ${money.format(promotionProfitListingPrice)} 拼单价。`;
  document.getElementById("promotionReferenceFormula").textContent =
    `毛利率 ${percent.format(grossMarginRate)}；持平投产比 ${formatRatio(flatRoi)}；最佳盈利投产比 ${formatRatio(bestProfitRoi)}；保本成交出价 ${money.format(breakEvenBid)}。`;
}

function calculateDouyinLogic({ targetProfit, returnRate }) {
  const purchaseCost = numberValue("purchaseCost");
  const shippingFee = numberValue("shippingFee");
  const freightInsurance = numberValue("freightInsurance");
  const couponAmount = currentCouponAmount();
  const signedRate = 1 - returnRate;
  const fixedOrderLoss = shippingFee + freightInsurance;
  const returnLossShare = safeRatio(returnRate, signedRate) * fixedOrderLoss;
  const baseCost = purchaseCost + fixedOrderLoss + returnLossShare;
  const promotionEnabled = document.getElementById("promotionSwitch").checked;
  const promotionRoi = promotionEnabled ? Math.max(numberValue("promotionRoi"), 1.01) : 0;
  const promotionDivisor = promotionEnabled ? 1 - 1 / promotionRoi : 1;
  const breakEvenDealPrice = baseCost;
  const profitDealPrice = baseCost + targetProfit;
  const promotionBreakEvenDealPrice = baseCost / promotionDivisor;
  const promotionProfitDealPrice = (baseCost + targetProfit) / promotionDivisor;
  const breakEvenPlatformPrice = roundUpCent(breakEvenDealPrice + couponAmount);
  const profitPlatformPrice = roundUpCent(profitDealPrice + couponAmount);
  const promotionBreakEvenPlatformPrice = roundUpCent(promotionBreakEvenDealPrice + couponAmount);
  const promotionProfitPlatformPrice = roundUpCent(promotionProfitDealPrice + couponAmount);

  document.getElementById("douyinBreakEvenPlatformPrice").textContent = money.format(breakEvenPlatformPrice);
  document.getElementById("douyinBreakEvenDealPrice").textContent = `最终成交价 ${money.format(breakEvenDealPrice)}`;
  document.getElementById("douyinProfitPlatformPrice").textContent = money.format(profitPlatformPrice);
  document.getElementById("douyinProfitDealPrice").textContent = `最终成交价 ${money.format(profitDealPrice)}`;
  document.getElementById("douyinPromotionBreakEvenPlatformPrice").textContent = money.format(promotionBreakEvenPlatformPrice);
  document.getElementById("douyinPromotionBreakEvenDealPrice").textContent = `最终成交价 ${money.format(promotionBreakEvenDealPrice)}`;
  document.getElementById("douyinPromotionProfitPlatformPrice").textContent = money.format(promotionProfitPlatformPrice);
  document.getElementById("douyinPromotionProfitDealPrice").textContent = `最终成交价 ${money.format(promotionProfitDealPrice)}`;
  document.getElementById("douyinCouponLine").textContent = money.format(couponAmount);
  document.getElementById("douyinBreakEvenDealLine").textContent = money.format(breakEvenDealPrice);
  document.getElementById("douyinProfitDealLine").textContent = money.format(profitDealPrice);
  document.getElementById("douyinBreakEvenFormula").textContent =
    `${money.format(breakEvenDealPrice)} 最终成交价 + ${money.format(couponAmount)} 优惠券 = ${money.format(breakEvenPlatformPrice)} 不推广不亏本价格`;
  document.getElementById("douyinProfitFormula").textContent =
    `${money.format(profitDealPrice)} 最终成交价 + ${money.format(couponAmount)} 优惠券 = ${money.format(profitPlatformPrice)} 不推广带利润价格`;
}

function syncPromotionSwitch() {
  const enabled = document.getElementById("promotionSwitch").checked;
  const roiInput = document.getElementById("promotionRoi");
  roiInput.disabled = !enabled;
  if (!enabled) {
    roiInput.value = "0";
  } else if (Number(roiInput.value) <= 0) {
    roiInput.value = "5";
  }
}

function setDefaultValues() {
  ids.forEach((id) => {
    document.getElementById(id).value = defaults[id];
  });
  document.getElementById("promotionSwitch").checked = false;
  syncPromotionSwitch();
  calculate();
}

ids.forEach((id) => {
  document.getElementById(id).addEventListener("input", calculate);
});

document.getElementById("customDiscount").addEventListener("blur", () => {
  normalizeDiscountInput();
  calculate();
});

document.getElementById("promotionSwitch").addEventListener("change", () => {
  syncPromotionSwitch();
  calculate();
});

document.querySelectorAll(".mini-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    const previousProfit = targetProfitValue(numberValue("purchaseCost"));
    document.querySelectorAll(".mini-tab").forEach((item) => {
      item.classList.toggle("active", item === tab);
    });
    const purchaseCost = numberValue("purchaseCost");
    const input = document.getElementById("targetProfit");
    if (currentProfitMode() === "percent") {
      input.value = purchaseCost > 0 ? (previousProfit / purchaseCost * 100).toFixed(2) : "0";
    } else {
      input.value = previousProfit.toFixed(2);
    }
    syncTargetProfitMode();
    calculate();
  });
});

document.querySelectorAll(".logic-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    savePlatformInputValue();
    const platformName = tab.dataset.platform;
    document.querySelectorAll(".logic-tab").forEach((item) => {
      item.classList.toggle("active", item.dataset.platform === platformName);
    });
    syncPlatformField();
    document.getElementById("pddPanel").classList.toggle("hidden", platformName !== "pdd");
    document.getElementById("douyinPanel").classList.toggle("hidden", platformName !== "douyin");
    calculate();
  });
});

syncPlatformField();
setDefaultValues();
