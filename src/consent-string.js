const { encodeConsentString, getMaxVendorId, encodeVendorIdsToBits, encodePurposeIdsToBits } = require('./encode');
const { decodeConsentString } = require('./decode');
const { vendorVersionMap } = require('./utils/definitions');
/**
 * Regular expression for validating
 */
const consentLanguageRegexp = /^[a-z]{2}$/;

class ConsentString {
  constructor(baseString = null) {
    this.created = new Date();
    this.lastUpdated = new Date();
    this.version = 1;
    this.vendorList = null;
    this.vendorListVersion = null;
    this.cmpId = null;
    this.cmpVersion = null;
    this.consentScreen = null;
    this.consentLanguage = null;
    this.allowedPurposeIds = [];
    this.allowedVendorIds = [];

    // Decode the base string
    if (baseString) {
      Object.assign(this, decodeConsentString(baseString));
    }
  }
  getConsentString(updateDate = true) {
    if (!this.vendorList) {
      throw new Error('ConsentString - A vendor list is required to encode a consent string');
    }

    if (updateDate === true) {
      this.lastUpdated = new Date();
    }

    return encodeConsentString({
      version: this.getVersion(),
      vendorList: this.vendorList,
      allowedPurposeIds: this.allowedPurposeIds,
      allowedVendorIds: this.allowedVendorIds,
      created: this.created,
      lastUpdated: this.lastUpdated,
      cmpId: this.cmpId,
      cmpVersion: this.cmpVersion,
      consentScreen: this.consentScreen,
      consentLanguage: this.consentLanguage,
      vendorListVersion: this.vendorListVersion,
    });
  }
  getLastUpdated() {

    return this.lastUpdated;
  }
  setLastUpdated(date = null) {
    if(date) {

      this.lastUpdated = new Date(date);
    } else {

      this.lastUpdated = new Date();
    }
  }
  getCreated() {

    return this.created;
  }
  setCreated(date = null) {
    if(date) {

      this.created = new Date(date);
    } else {

      this.created = new Date();
    }
  }
  getMaxVendorId() {
    return getMaxVendorId(this.vendorList.vendors);
  }
  getParsedVendorConsents() {
    return encodeVendorIdsToBits(getMaxVendorId(this.vendorList.vendors), this.allowedVendorIds);
  }
  getParsedPurposeConsents() {
    return encodePurposeIdsToBits(this.vendorList.purposes, this.allowedPurposeIds);
  }
  getMetadataString() {
    return encodeConsentString({
      version: this.getVersion(),
      created: this.created,
      lastUpdated: this.lastUpdated,
      cmpId: this.cmpId,
      cmpVersion: this.cmpVersion,
      consentScreen: this.consentScreen,
      vendorListVersion: this.vendorListVersion,
    });
  }
  static decodeMetadataString(encodedMetadata) {
    const decodedString = decodeConsentString(encodedMetadata);
    const metadata = {};
    vendorVersionMap[decodedString.version]
      .metadataFields.forEach((field) => {
        metadata[field] = decodedString[field];
      });
    return metadata;
  }
  getVersion() {
    return this.version;
  }
  getVendorListVersion() {
    return this.vendorListVersion;
  }
  setGlobalVendorList(vendorList) {
    if (typeof vendorList !== 'object') {
      throw new Error('ConsentString - You must provide an object when setting the global vendor list');
    }

    if (
      !vendorList.vendorListVersion
      || !Array.isArray(vendorList.purposes)
      || !Array.isArray(vendorList.vendors)
    ) {
      // The provided vendor list does not look valid
      throw new Error('ConsentString - The provided vendor list does not respect the schema from the IAB EU’s GDPR Consent and Transparency Framework');
    }

    // Cloning the GVL
    // It's important as we might transform it and don't want to modify objects that we do not own
    this.vendorList = {
      vendorListVersion: vendorList.vendorListVersion,
      lastUpdated: vendorList.lastUpdated,
      purposes: vendorList.purposes,
      features: vendorList.features,

      // Clone the list and sort the vendors by ID (it breaks our range generation algorithm if they are not sorted)
      vendors: vendorList.vendors
        .slice(0)
        .sort((firstVendor, secondVendor) => (firstVendor.id < secondVendor.id ? -1 : 1)),
    };
    this.vendorListVersion = vendorList.vendorListVersion;
  }
  getGlobalVendorList() {

    return this.vendorList;
  }
  setCmpId(id) {
    this.cmpId = id;
  }
  getCmpId() {
    return this.cmpId;
  }
  setCmpVersion(version) {
    this.cmpVersion = version;
  }
  getCmpVersion() {
    return this.cmpVersion;
  }
  setConsentScreen(screenId) {
    this.consentScreen = screenId;
  }
  getConsentScreen() {
    return this.consentScreen;
  }
  setConsentLanguage(language) {
    if (consentLanguageRegexp.test(language) === false) {
      throw new Error('ConsentString - The consent language must be a two-letter ISO639-1 code (en, fr, de, etc.)');
    }

    this.consentLanguage = language;
  }
  getConsentLanguage() {
    return this.consentLanguage;
  }
  setPurposesAllowed(purposeIds) {
    this.allowedPurposeIds = purposeIds;
  }
  getPurposesAllowed() {
    return this.allowedPurposeIds;
  }
  setPurposeAllowed(purposeId, value) {
    const purposeIndex = this.allowedPurposeIds.indexOf(purposeId);

    if (value === true) {
      if (purposeIndex === -1) {
        this.allowedPurposeIds.push(purposeId);
      }
    } else if (value === false) {
      if (purposeIndex !== -1) {
        this.allowedPurposeIds.splice(purposeIndex, 1);
      }
    }
  }
  isPurposeAllowed(purposeId) {
    return this.allowedPurposeIds.indexOf(purposeId) !== -1;
  }
  setVendorsAllowed(vendorIds) {
    this.allowedVendorIds = vendorIds;
  }
  getVendorsAllowed() {
    return this.allowedVendorIds;
  }
  setVendorAllowed(vendorId, value) {
    const vendorIndex = this.allowedVendorIds.indexOf(vendorId);

    if (value === true) {
      if (vendorIndex === -1) {
        this.allowedVendorIds.push(vendorId);
      }
    } else if (value === false) {
      if (vendorIndex !== -1) {
        this.allowedVendorIds.splice(vendorIndex, 1);
      }
    }
  }
  isVendorAllowed(vendorId) {
    return this.allowedVendorIds.indexOf(vendorId) !== -1;
  }
}

module.exports = {
  ConsentString,
};
