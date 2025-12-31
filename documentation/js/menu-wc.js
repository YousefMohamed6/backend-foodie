'use strict';

customElements.define('compodoc-menu', class extends HTMLElement {
    constructor() {
        super();
        this.isNormalMode = this.getAttribute('mode') === 'normal';
    }

    connectedCallback() {
        this.render(this.isNormalMode);
    }

    render(isNormalMode) {
        let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link">backend documentation</a>
                </li>

                <li class="divider"></li>
                ${ isNormalMode ? `<div id="book-search-input" role="search"><input type="text" placeholder="Type to search"></div>` : '' }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>
                    <ul class="links">
                                <li class="link">
                                    <a href="overview.html" data-type="chapter-link">
                                        <span class="icon ion-ios-keypad"></span>Overview
                                    </a>
                                </li>

                            <li class="link">
                                <a href="index.html" data-type="chapter-link">
                                    <span class="icon ion-ios-paper"></span>
                                        README
                                </a>
                            </li>
                                <li class="link">
                                    <a href="dependencies.html" data-type="chapter-link">
                                        <span class="icon ion-ios-list"></span>Dependencies
                                    </a>
                                </li>
                                <li class="link">
                                    <a href="properties.html" data-type="chapter-link">
                                        <span class="icon ion-ios-apps"></span>Properties
                                    </a>
                                </li>

                    </ul>
                </li>
                    <li class="chapter modules">
                        <a data-type="chapter-link" href="modules.html">
                            <div class="menu-toggler linked" data-bs-toggle="collapse" ${ isNormalMode ?
                                'data-bs-target="#modules-links"' : 'data-bs-target="#xs-modules-links"' }>
                                <span class="icon ion-ios-archive"></span>
                                <span class="link-name">Modules</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                        </a>
                        <ul class="links collapse " ${ isNormalMode ? 'id="modules-links"' : 'id="xs-modules-links"' }>
                            <li class="link">
                                <a href="modules/AddressesModule.html" data-type="entity-link" >AddressesModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-AddressesModule-71275331b463158a3f0c5627505c8571b6a0c3494478aabb220dcc6a6c094ef464d95264e791d07dd1afb0fe85a50417a2e893d90d529d436d56570209a3e9be"' : 'data-bs-target="#xs-controllers-links-module-AddressesModule-71275331b463158a3f0c5627505c8571b6a0c3494478aabb220dcc6a6c094ef464d95264e791d07dd1afb0fe85a50417a2e893d90d529d436d56570209a3e9be"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-AddressesModule-71275331b463158a3f0c5627505c8571b6a0c3494478aabb220dcc6a6c094ef464d95264e791d07dd1afb0fe85a50417a2e893d90d529d436d56570209a3e9be"' :
                                            'id="xs-controllers-links-module-AddressesModule-71275331b463158a3f0c5627505c8571b6a0c3494478aabb220dcc6a6c094ef464d95264e791d07dd1afb0fe85a50417a2e893d90d529d436d56570209a3e9be"' }>
                                            <li class="link">
                                                <a href="controllers/AddressesController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AddressesController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-AddressesModule-71275331b463158a3f0c5627505c8571b6a0c3494478aabb220dcc6a6c094ef464d95264e791d07dd1afb0fe85a50417a2e893d90d529d436d56570209a3e9be"' : 'data-bs-target="#xs-injectables-links-module-AddressesModule-71275331b463158a3f0c5627505c8571b6a0c3494478aabb220dcc6a6c094ef464d95264e791d07dd1afb0fe85a50417a2e893d90d529d436d56570209a3e9be"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AddressesModule-71275331b463158a3f0c5627505c8571b6a0c3494478aabb220dcc6a6c094ef464d95264e791d07dd1afb0fe85a50417a2e893d90d529d436d56570209a3e9be"' :
                                        'id="xs-injectables-links-module-AddressesModule-71275331b463158a3f0c5627505c8571b6a0c3494478aabb220dcc6a6c094ef464d95264e791d07dd1afb0fe85a50417a2e893d90d529d436d56570209a3e9be"' }>
                                        <li class="link">
                                            <a href="injectables/AddressesService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AddressesService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/AdminModule.html" data-type="entity-link" >AdminModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-AdminModule-29171906605e5195cddd17541081265bcb369af81a6d54dfe26f8aafe350b7d55f2ab2314b96f705b085271e30783ce186e6a9db89019467b9f26247bf9a5bba"' : 'data-bs-target="#xs-controllers-links-module-AdminModule-29171906605e5195cddd17541081265bcb369af81a6d54dfe26f8aafe350b7d55f2ab2314b96f705b085271e30783ce186e6a9db89019467b9f26247bf9a5bba"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-AdminModule-29171906605e5195cddd17541081265bcb369af81a6d54dfe26f8aafe350b7d55f2ab2314b96f705b085271e30783ce186e6a9db89019467b9f26247bf9a5bba"' :
                                            'id="xs-controllers-links-module-AdminModule-29171906605e5195cddd17541081265bcb369af81a6d54dfe26f8aafe350b7d55f2ab2314b96f705b085271e30783ce186e6a9db89019467b9f26247bf9a5bba"' }>
                                            <li class="link">
                                                <a href="controllers/AdminController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AdminController</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/AdvertisementsModule.html" data-type="entity-link" >AdvertisementsModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-AdvertisementsModule-fcdca3c7e74bd318dcb3dff2842a8d5fc30c1513d6be6f7a9968d112aa831e2d10aa7e8e00def66eafca5fb32ede0d6fd7b8af49afb7e855e548046a2aab10bf"' : 'data-bs-target="#xs-controllers-links-module-AdvertisementsModule-fcdca3c7e74bd318dcb3dff2842a8d5fc30c1513d6be6f7a9968d112aa831e2d10aa7e8e00def66eafca5fb32ede0d6fd7b8af49afb7e855e548046a2aab10bf"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-AdvertisementsModule-fcdca3c7e74bd318dcb3dff2842a8d5fc30c1513d6be6f7a9968d112aa831e2d10aa7e8e00def66eafca5fb32ede0d6fd7b8af49afb7e855e548046a2aab10bf"' :
                                            'id="xs-controllers-links-module-AdvertisementsModule-fcdca3c7e74bd318dcb3dff2842a8d5fc30c1513d6be6f7a9968d112aa831e2d10aa7e8e00def66eafca5fb32ede0d6fd7b8af49afb7e855e548046a2aab10bf"' }>
                                            <li class="link">
                                                <a href="controllers/AdvertisementsController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AdvertisementsController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-AdvertisementsModule-fcdca3c7e74bd318dcb3dff2842a8d5fc30c1513d6be6f7a9968d112aa831e2d10aa7e8e00def66eafca5fb32ede0d6fd7b8af49afb7e855e548046a2aab10bf"' : 'data-bs-target="#xs-injectables-links-module-AdvertisementsModule-fcdca3c7e74bd318dcb3dff2842a8d5fc30c1513d6be6f7a9968d112aa831e2d10aa7e8e00def66eafca5fb32ede0d6fd7b8af49afb7e855e548046a2aab10bf"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AdvertisementsModule-fcdca3c7e74bd318dcb3dff2842a8d5fc30c1513d6be6f7a9968d112aa831e2d10aa7e8e00def66eafca5fb32ede0d6fd7b8af49afb7e855e548046a2aab10bf"' :
                                        'id="xs-injectables-links-module-AdvertisementsModule-fcdca3c7e74bd318dcb3dff2842a8d5fc30c1513d6be6f7a9968d112aa831e2d10aa7e8e00def66eafca5fb32ede0d6fd7b8af49afb7e855e548046a2aab10bf"' }>
                                        <li class="link">
                                            <a href="injectables/AdvertisementsService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AdvertisementsService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/AppModule.html" data-type="entity-link" >AppModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-AppModule-b216555f160dfe46a0ef2fbf241ab2e464cfc4515914b10b33254101a3545dbe4e341384ad024486f1d3deb3a5764c583df7f909777fcf1ac1f6f74115b49f67"' : 'data-bs-target="#xs-controllers-links-module-AppModule-b216555f160dfe46a0ef2fbf241ab2e464cfc4515914b10b33254101a3545dbe4e341384ad024486f1d3deb3a5764c583df7f909777fcf1ac1f6f74115b49f67"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-AppModule-b216555f160dfe46a0ef2fbf241ab2e464cfc4515914b10b33254101a3545dbe4e341384ad024486f1d3deb3a5764c583df7f909777fcf1ac1f6f74115b49f67"' :
                                            'id="xs-controllers-links-module-AppModule-b216555f160dfe46a0ef2fbf241ab2e464cfc4515914b10b33254101a3545dbe4e341384ad024486f1d3deb3a5764c583df7f909777fcf1ac1f6f74115b49f67"' }>
                                            <li class="link">
                                                <a href="controllers/AppController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AppController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-AppModule-b216555f160dfe46a0ef2fbf241ab2e464cfc4515914b10b33254101a3545dbe4e341384ad024486f1d3deb3a5764c583df7f909777fcf1ac1f6f74115b49f67"' : 'data-bs-target="#xs-injectables-links-module-AppModule-b216555f160dfe46a0ef2fbf241ab2e464cfc4515914b10b33254101a3545dbe4e341384ad024486f1d3deb3a5764c583df7f909777fcf1ac1f6f74115b49f67"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AppModule-b216555f160dfe46a0ef2fbf241ab2e464cfc4515914b10b33254101a3545dbe4e341384ad024486f1d3deb3a5764c583df7f909777fcf1ac1f6f74115b49f67"' :
                                        'id="xs-injectables-links-module-AppModule-b216555f160dfe46a0ef2fbf241ab2e464cfc4515914b10b33254101a3545dbe4e341384ad024486f1d3deb3a5764c583df7f909777fcf1ac1f6f74115b49f67"' }>
                                        <li class="link">
                                            <a href="injectables/AppService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AppService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/AttributesModule.html" data-type="entity-link" >AttributesModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-AttributesModule-660327fbfc734fed6741c06578a8a3f6f2877b27c6c9887b1e2248c009f0baaebfb2383d89b8cfc57f1d2750c3ee013d8f2688a2bd7ed847e49f335d1f4ca473"' : 'data-bs-target="#xs-controllers-links-module-AttributesModule-660327fbfc734fed6741c06578a8a3f6f2877b27c6c9887b1e2248c009f0baaebfb2383d89b8cfc57f1d2750c3ee013d8f2688a2bd7ed847e49f335d1f4ca473"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-AttributesModule-660327fbfc734fed6741c06578a8a3f6f2877b27c6c9887b1e2248c009f0baaebfb2383d89b8cfc57f1d2750c3ee013d8f2688a2bd7ed847e49f335d1f4ca473"' :
                                            'id="xs-controllers-links-module-AttributesModule-660327fbfc734fed6741c06578a8a3f6f2877b27c6c9887b1e2248c009f0baaebfb2383d89b8cfc57f1d2750c3ee013d8f2688a2bd7ed847e49f335d1f4ca473"' }>
                                            <li class="link">
                                                <a href="controllers/AttributesController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AttributesController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-AttributesModule-660327fbfc734fed6741c06578a8a3f6f2877b27c6c9887b1e2248c009f0baaebfb2383d89b8cfc57f1d2750c3ee013d8f2688a2bd7ed847e49f335d1f4ca473"' : 'data-bs-target="#xs-injectables-links-module-AttributesModule-660327fbfc734fed6741c06578a8a3f6f2877b27c6c9887b1e2248c009f0baaebfb2383d89b8cfc57f1d2750c3ee013d8f2688a2bd7ed847e49f335d1f4ca473"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AttributesModule-660327fbfc734fed6741c06578a8a3f6f2877b27c6c9887b1e2248c009f0baaebfb2383d89b8cfc57f1d2750c3ee013d8f2688a2bd7ed847e49f335d1f4ca473"' :
                                        'id="xs-injectables-links-module-AttributesModule-660327fbfc734fed6741c06578a8a3f6f2877b27c6c9887b1e2248c009f0baaebfb2383d89b8cfc57f1d2750c3ee013d8f2688a2bd7ed847e49f335d1f4ca473"' }>
                                        <li class="link">
                                            <a href="injectables/AttributesService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AttributesService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/AuthModule.html" data-type="entity-link" >AuthModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-AuthModule-580acc5cb331b3d15929caf73af6cd3eadeb2cd10b5d2446f7bb41e9dae4f2ce915163721e9decb40b7f4cc0a9749363ca77c472eb533cfefd260c1415f5423c"' : 'data-bs-target="#xs-controllers-links-module-AuthModule-580acc5cb331b3d15929caf73af6cd3eadeb2cd10b5d2446f7bb41e9dae4f2ce915163721e9decb40b7f4cc0a9749363ca77c472eb533cfefd260c1415f5423c"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-AuthModule-580acc5cb331b3d15929caf73af6cd3eadeb2cd10b5d2446f7bb41e9dae4f2ce915163721e9decb40b7f4cc0a9749363ca77c472eb533cfefd260c1415f5423c"' :
                                            'id="xs-controllers-links-module-AuthModule-580acc5cb331b3d15929caf73af6cd3eadeb2cd10b5d2446f7bb41e9dae4f2ce915163721e9decb40b7f4cc0a9749363ca77c472eb533cfefd260c1415f5423c"' }>
                                            <li class="link">
                                                <a href="controllers/AuthController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AuthController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-AuthModule-580acc5cb331b3d15929caf73af6cd3eadeb2cd10b5d2446f7bb41e9dae4f2ce915163721e9decb40b7f4cc0a9749363ca77c472eb533cfefd260c1415f5423c"' : 'data-bs-target="#xs-injectables-links-module-AuthModule-580acc5cb331b3d15929caf73af6cd3eadeb2cd10b5d2446f7bb41e9dae4f2ce915163721e9decb40b7f4cc0a9749363ca77c472eb533cfefd260c1415f5423c"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AuthModule-580acc5cb331b3d15929caf73af6cd3eadeb2cd10b5d2446f7bb41e9dae4f2ce915163721e9decb40b7f4cc0a9749363ca77c472eb533cfefd260c1415f5423c"' :
                                        'id="xs-injectables-links-module-AuthModule-580acc5cb331b3d15929caf73af6cd3eadeb2cd10b5d2446f7bb41e9dae4f2ce915163721e9decb40b7f4cc0a9749363ca77c472eb533cfefd260c1415f5423c"' }>
                                        <li class="link">
                                            <a href="injectables/AppleAuthService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AppleAuthService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/AppleStrategy.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AppleStrategy</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/AuthService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AuthService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/GoogleAuthService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >GoogleAuthService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/GoogleStrategy.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >GoogleStrategy</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/JwtStrategy.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >JwtStrategy</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/BannersModule.html" data-type="entity-link" >BannersModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-BannersModule-df738dd1f5e635482b7f8c882408955bfb988816503375b1cc00bf6da680edcd9b150f46ffa3476d814406ef0147c3729ee3e4c6716b64d7c0bda83e287336fd"' : 'data-bs-target="#xs-controllers-links-module-BannersModule-df738dd1f5e635482b7f8c882408955bfb988816503375b1cc00bf6da680edcd9b150f46ffa3476d814406ef0147c3729ee3e4c6716b64d7c0bda83e287336fd"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-BannersModule-df738dd1f5e635482b7f8c882408955bfb988816503375b1cc00bf6da680edcd9b150f46ffa3476d814406ef0147c3729ee3e4c6716b64d7c0bda83e287336fd"' :
                                            'id="xs-controllers-links-module-BannersModule-df738dd1f5e635482b7f8c882408955bfb988816503375b1cc00bf6da680edcd9b150f46ffa3476d814406ef0147c3729ee3e4c6716b64d7c0bda83e287336fd"' }>
                                            <li class="link">
                                                <a href="controllers/BannersController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >BannersController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-BannersModule-df738dd1f5e635482b7f8c882408955bfb988816503375b1cc00bf6da680edcd9b150f46ffa3476d814406ef0147c3729ee3e4c6716b64d7c0bda83e287336fd"' : 'data-bs-target="#xs-injectables-links-module-BannersModule-df738dd1f5e635482b7f8c882408955bfb988816503375b1cc00bf6da680edcd9b150f46ffa3476d814406ef0147c3729ee3e4c6716b64d7c0bda83e287336fd"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-BannersModule-df738dd1f5e635482b7f8c882408955bfb988816503375b1cc00bf6da680edcd9b150f46ffa3476d814406ef0147c3729ee3e4c6716b64d7c0bda83e287336fd"' :
                                        'id="xs-injectables-links-module-BannersModule-df738dd1f5e635482b7f8c882408955bfb988816503375b1cc00bf6da680edcd9b150f46ffa3476d814406ef0147c3729ee3e4c6716b64d7c0bda83e287336fd"' }>
                                        <li class="link">
                                            <a href="injectables/BannersService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >BannersService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/CashbackModule.html" data-type="entity-link" >CashbackModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-CashbackModule-74bd640e43a8f842fcc67f3210f436d1126d55fde93008927171387fab9e1a13ed53b942867f37ccc1889d183594d384b7bf655522967e56f9c10d397958126b"' : 'data-bs-target="#xs-controllers-links-module-CashbackModule-74bd640e43a8f842fcc67f3210f436d1126d55fde93008927171387fab9e1a13ed53b942867f37ccc1889d183594d384b7bf655522967e56f9c10d397958126b"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-CashbackModule-74bd640e43a8f842fcc67f3210f436d1126d55fde93008927171387fab9e1a13ed53b942867f37ccc1889d183594d384b7bf655522967e56f9c10d397958126b"' :
                                            'id="xs-controllers-links-module-CashbackModule-74bd640e43a8f842fcc67f3210f436d1126d55fde93008927171387fab9e1a13ed53b942867f37ccc1889d183594d384b7bf655522967e56f9c10d397958126b"' }>
                                            <li class="link">
                                                <a href="controllers/CashbackController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CashbackController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-CashbackModule-74bd640e43a8f842fcc67f3210f436d1126d55fde93008927171387fab9e1a13ed53b942867f37ccc1889d183594d384b7bf655522967e56f9c10d397958126b"' : 'data-bs-target="#xs-injectables-links-module-CashbackModule-74bd640e43a8f842fcc67f3210f436d1126d55fde93008927171387fab9e1a13ed53b942867f37ccc1889d183594d384b7bf655522967e56f9c10d397958126b"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-CashbackModule-74bd640e43a8f842fcc67f3210f436d1126d55fde93008927171387fab9e1a13ed53b942867f37ccc1889d183594d384b7bf655522967e56f9c10d397958126b"' :
                                        'id="xs-injectables-links-module-CashbackModule-74bd640e43a8f842fcc67f3210f436d1126d55fde93008927171387fab9e1a13ed53b942867f37ccc1889d183594d384b7bf655522967e56f9c10d397958126b"' }>
                                        <li class="link">
                                            <a href="injectables/CashbackService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CashbackService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/CategoriesModule.html" data-type="entity-link" >CategoriesModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-CategoriesModule-caadf3a827f834c86b4a910767f099cb58db5dc56c74c77a4861b89258373f0fff858ac52eb7dad0e211f7549ec9d9adcb93c5c62225cd98925013a88b5d2f2a"' : 'data-bs-target="#xs-controllers-links-module-CategoriesModule-caadf3a827f834c86b4a910767f099cb58db5dc56c74c77a4861b89258373f0fff858ac52eb7dad0e211f7549ec9d9adcb93c5c62225cd98925013a88b5d2f2a"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-CategoriesModule-caadf3a827f834c86b4a910767f099cb58db5dc56c74c77a4861b89258373f0fff858ac52eb7dad0e211f7549ec9d9adcb93c5c62225cd98925013a88b5d2f2a"' :
                                            'id="xs-controllers-links-module-CategoriesModule-caadf3a827f834c86b4a910767f099cb58db5dc56c74c77a4861b89258373f0fff858ac52eb7dad0e211f7549ec9d9adcb93c5c62225cd98925013a88b5d2f2a"' }>
                                            <li class="link">
                                                <a href="controllers/CategoriesController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CategoriesController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-CategoriesModule-caadf3a827f834c86b4a910767f099cb58db5dc56c74c77a4861b89258373f0fff858ac52eb7dad0e211f7549ec9d9adcb93c5c62225cd98925013a88b5d2f2a"' : 'data-bs-target="#xs-injectables-links-module-CategoriesModule-caadf3a827f834c86b4a910767f099cb58db5dc56c74c77a4861b89258373f0fff858ac52eb7dad0e211f7549ec9d9adcb93c5c62225cd98925013a88b5d2f2a"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-CategoriesModule-caadf3a827f834c86b4a910767f099cb58db5dc56c74c77a4861b89258373f0fff858ac52eb7dad0e211f7549ec9d9adcb93c5c62225cd98925013a88b5d2f2a"' :
                                        'id="xs-injectables-links-module-CategoriesModule-caadf3a827f834c86b4a910767f099cb58db5dc56c74c77a4861b89258373f0fff858ac52eb7dad0e211f7549ec9d9adcb93c5c62225cd98925013a88b5d2f2a"' }>
                                        <li class="link">
                                            <a href="injectables/CategoriesService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CategoriesService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/ChatModule.html" data-type="entity-link" >ChatModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-ChatModule-7686d70252cc1d691b8b90716342e3d447cee7490d1dea9f992dd325fa481ba0ad1846b6b08c30d1d543b7e48394f50ff09cf48e0cfa97973f51adfde8a43ad8"' : 'data-bs-target="#xs-controllers-links-module-ChatModule-7686d70252cc1d691b8b90716342e3d447cee7490d1dea9f992dd325fa481ba0ad1846b6b08c30d1d543b7e48394f50ff09cf48e0cfa97973f51adfde8a43ad8"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-ChatModule-7686d70252cc1d691b8b90716342e3d447cee7490d1dea9f992dd325fa481ba0ad1846b6b08c30d1d543b7e48394f50ff09cf48e0cfa97973f51adfde8a43ad8"' :
                                            'id="xs-controllers-links-module-ChatModule-7686d70252cc1d691b8b90716342e3d447cee7490d1dea9f992dd325fa481ba0ad1846b6b08c30d1d543b7e48394f50ff09cf48e0cfa97973f51adfde8a43ad8"' }>
                                            <li class="link">
                                                <a href="controllers/ChatController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ChatController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-ChatModule-7686d70252cc1d691b8b90716342e3d447cee7490d1dea9f992dd325fa481ba0ad1846b6b08c30d1d543b7e48394f50ff09cf48e0cfa97973f51adfde8a43ad8"' : 'data-bs-target="#xs-injectables-links-module-ChatModule-7686d70252cc1d691b8b90716342e3d447cee7490d1dea9f992dd325fa481ba0ad1846b6b08c30d1d543b7e48394f50ff09cf48e0cfa97973f51adfde8a43ad8"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-ChatModule-7686d70252cc1d691b8b90716342e3d447cee7490d1dea9f992dd325fa481ba0ad1846b6b08c30d1d543b7e48394f50ff09cf48e0cfa97973f51adfde8a43ad8"' :
                                        'id="xs-injectables-links-module-ChatModule-7686d70252cc1d691b8b90716342e3d447cee7490d1dea9f992dd325fa481ba0ad1846b6b08c30d1d543b7e48394f50ff09cf48e0cfa97973f51adfde8a43ad8"' }>
                                        <li class="link">
                                            <a href="injectables/ChatService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ChatService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/ConfigModule.html" data-type="entity-link" >ConfigModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-ConfigModule-686fb757cc0fc9b6196b5d1e840c3efbdb8755bb17d0b6a87d98620a55948cc450a9e5d20970858fb350a6bd9c21bcae776c7f7adfa8fe00de4168c540bba2a8"' : 'data-bs-target="#xs-controllers-links-module-ConfigModule-686fb757cc0fc9b6196b5d1e840c3efbdb8755bb17d0b6a87d98620a55948cc450a9e5d20970858fb350a6bd9c21bcae776c7f7adfa8fe00de4168c540bba2a8"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-ConfigModule-686fb757cc0fc9b6196b5d1e840c3efbdb8755bb17d0b6a87d98620a55948cc450a9e5d20970858fb350a6bd9c21bcae776c7f7adfa8fe00de4168c540bba2a8"' :
                                            'id="xs-controllers-links-module-ConfigModule-686fb757cc0fc9b6196b5d1e840c3efbdb8755bb17d0b6a87d98620a55948cc450a9e5d20970858fb350a6bd9c21bcae776c7f7adfa8fe00de4168c540bba2a8"' }>
                                            <li class="link">
                                                <a href="controllers/ConfigController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ConfigController</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/CouponsModule.html" data-type="entity-link" >CouponsModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-CouponsModule-d3923a6b67f29a13eaf0bcc13876a8e023b9fcd522f252ef84a29bbc5fcbc2eaaca6db2785ab0d5b61f65aefca21ef46868dd983b7abe189b0a1cfffa33327ad"' : 'data-bs-target="#xs-controllers-links-module-CouponsModule-d3923a6b67f29a13eaf0bcc13876a8e023b9fcd522f252ef84a29bbc5fcbc2eaaca6db2785ab0d5b61f65aefca21ef46868dd983b7abe189b0a1cfffa33327ad"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-CouponsModule-d3923a6b67f29a13eaf0bcc13876a8e023b9fcd522f252ef84a29bbc5fcbc2eaaca6db2785ab0d5b61f65aefca21ef46868dd983b7abe189b0a1cfffa33327ad"' :
                                            'id="xs-controllers-links-module-CouponsModule-d3923a6b67f29a13eaf0bcc13876a8e023b9fcd522f252ef84a29bbc5fcbc2eaaca6db2785ab0d5b61f65aefca21ef46868dd983b7abe189b0a1cfffa33327ad"' }>
                                            <li class="link">
                                                <a href="controllers/CouponsController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CouponsController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-CouponsModule-d3923a6b67f29a13eaf0bcc13876a8e023b9fcd522f252ef84a29bbc5fcbc2eaaca6db2785ab0d5b61f65aefca21ef46868dd983b7abe189b0a1cfffa33327ad"' : 'data-bs-target="#xs-injectables-links-module-CouponsModule-d3923a6b67f29a13eaf0bcc13876a8e023b9fcd522f252ef84a29bbc5fcbc2eaaca6db2785ab0d5b61f65aefca21ef46868dd983b7abe189b0a1cfffa33327ad"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-CouponsModule-d3923a6b67f29a13eaf0bcc13876a8e023b9fcd522f252ef84a29bbc5fcbc2eaaca6db2785ab0d5b61f65aefca21ef46868dd983b7abe189b0a1cfffa33327ad"' :
                                        'id="xs-injectables-links-module-CouponsModule-d3923a6b67f29a13eaf0bcc13876a8e023b9fcd522f252ef84a29bbc5fcbc2eaaca6db2785ab0d5b61f65aefca21ef46868dd983b7abe189b0a1cfffa33327ad"' }>
                                        <li class="link">
                                            <a href="injectables/CouponsService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CouponsService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/CurrenciesModule.html" data-type="entity-link" >CurrenciesModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-CurrenciesModule-5669058ab57788f83db8cce3dfb2074f41263cbcea6442abb471e5b24f7490208cbdeb409e8c4ced8599374c5b372be40920338056f4778a71d629edee48dbc5"' : 'data-bs-target="#xs-controllers-links-module-CurrenciesModule-5669058ab57788f83db8cce3dfb2074f41263cbcea6442abb471e5b24f7490208cbdeb409e8c4ced8599374c5b372be40920338056f4778a71d629edee48dbc5"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-CurrenciesModule-5669058ab57788f83db8cce3dfb2074f41263cbcea6442abb471e5b24f7490208cbdeb409e8c4ced8599374c5b372be40920338056f4778a71d629edee48dbc5"' :
                                            'id="xs-controllers-links-module-CurrenciesModule-5669058ab57788f83db8cce3dfb2074f41263cbcea6442abb471e5b24f7490208cbdeb409e8c4ced8599374c5b372be40920338056f4778a71d629edee48dbc5"' }>
                                            <li class="link">
                                                <a href="controllers/CurrenciesController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CurrenciesController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-CurrenciesModule-5669058ab57788f83db8cce3dfb2074f41263cbcea6442abb471e5b24f7490208cbdeb409e8c4ced8599374c5b372be40920338056f4778a71d629edee48dbc5"' : 'data-bs-target="#xs-injectables-links-module-CurrenciesModule-5669058ab57788f83db8cce3dfb2074f41263cbcea6442abb471e5b24f7490208cbdeb409e8c4ced8599374c5b372be40920338056f4778a71d629edee48dbc5"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-CurrenciesModule-5669058ab57788f83db8cce3dfb2074f41263cbcea6442abb471e5b24f7490208cbdeb409e8c4ced8599374c5b372be40920338056f4778a71d629edee48dbc5"' :
                                        'id="xs-injectables-links-module-CurrenciesModule-5669058ab57788f83db8cce3dfb2074f41263cbcea6442abb471e5b24f7490208cbdeb409e8c4ced8599374c5b372be40920338056f4778a71d629edee48dbc5"' }>
                                        <li class="link">
                                            <a href="injectables/CurrenciesSeederService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CurrenciesSeederService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/CurrenciesService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CurrenciesService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/DeliveryModule.html" data-type="entity-link" >DeliveryModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-DeliveryModule-267f1d3ed05017a322c6222762f053079859de0b343b37f89b15d8045b11f29e1b307b8f389735f4a363d40c66b2e234c2da9788ef3f94a8b265b1cc15b4cb0c"' : 'data-bs-target="#xs-controllers-links-module-DeliveryModule-267f1d3ed05017a322c6222762f053079859de0b343b37f89b15d8045b11f29e1b307b8f389735f4a363d40c66b2e234c2da9788ef3f94a8b265b1cc15b4cb0c"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-DeliveryModule-267f1d3ed05017a322c6222762f053079859de0b343b37f89b15d8045b11f29e1b307b8f389735f4a363d40c66b2e234c2da9788ef3f94a8b265b1cc15b4cb0c"' :
                                            'id="xs-controllers-links-module-DeliveryModule-267f1d3ed05017a322c6222762f053079859de0b343b37f89b15d8045b11f29e1b307b8f389735f4a363d40c66b2e234c2da9788ef3f94a8b265b1cc15b4cb0c"' }>
                                            <li class="link">
                                                <a href="controllers/DeliveryController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DeliveryController</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/DineInModule.html" data-type="entity-link" >DineInModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-DineInModule-0faad6829fb2a8839c610a9318589146ddb00048c002f5dde99eb49065eaccb94ff59748e8edb4f9728d147502ce4922b27b350652dec88628ea1a721e3cf3ba"' : 'data-bs-target="#xs-controllers-links-module-DineInModule-0faad6829fb2a8839c610a9318589146ddb00048c002f5dde99eb49065eaccb94ff59748e8edb4f9728d147502ce4922b27b350652dec88628ea1a721e3cf3ba"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-DineInModule-0faad6829fb2a8839c610a9318589146ddb00048c002f5dde99eb49065eaccb94ff59748e8edb4f9728d147502ce4922b27b350652dec88628ea1a721e3cf3ba"' :
                                            'id="xs-controllers-links-module-DineInModule-0faad6829fb2a8839c610a9318589146ddb00048c002f5dde99eb49065eaccb94ff59748e8edb4f9728d147502ce4922b27b350652dec88628ea1a721e3cf3ba"' }>
                                            <li class="link">
                                                <a href="controllers/DineInController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DineInController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-DineInModule-0faad6829fb2a8839c610a9318589146ddb00048c002f5dde99eb49065eaccb94ff59748e8edb4f9728d147502ce4922b27b350652dec88628ea1a721e3cf3ba"' : 'data-bs-target="#xs-injectables-links-module-DineInModule-0faad6829fb2a8839c610a9318589146ddb00048c002f5dde99eb49065eaccb94ff59748e8edb4f9728d147502ce4922b27b350652dec88628ea1a721e3cf3ba"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-DineInModule-0faad6829fb2a8839c610a9318589146ddb00048c002f5dde99eb49065eaccb94ff59748e8edb4f9728d147502ce4922b27b350652dec88628ea1a721e3cf3ba"' :
                                        'id="xs-injectables-links-module-DineInModule-0faad6829fb2a8839c610a9318589146ddb00048c002f5dde99eb49065eaccb94ff59748e8edb4f9728d147502ce4922b27b350652dec88628ea1a721e3cf3ba"' }>
                                        <li class="link">
                                            <a href="injectables/DineInService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DineInService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/DocumentsModule.html" data-type="entity-link" >DocumentsModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-DocumentsModule-4deb3fbd09764aad2bef35854a55c0627c204b1729d4451998def5096a5cddf653ea89599d028cd39c2df26eb07e277acab462218167a20490c67b5680474e9f"' : 'data-bs-target="#xs-controllers-links-module-DocumentsModule-4deb3fbd09764aad2bef35854a55c0627c204b1729d4451998def5096a5cddf653ea89599d028cd39c2df26eb07e277acab462218167a20490c67b5680474e9f"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-DocumentsModule-4deb3fbd09764aad2bef35854a55c0627c204b1729d4451998def5096a5cddf653ea89599d028cd39c2df26eb07e277acab462218167a20490c67b5680474e9f"' :
                                            'id="xs-controllers-links-module-DocumentsModule-4deb3fbd09764aad2bef35854a55c0627c204b1729d4451998def5096a5cddf653ea89599d028cd39c2df26eb07e277acab462218167a20490c67b5680474e9f"' }>
                                            <li class="link">
                                                <a href="controllers/DocumentsController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DocumentsController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-DocumentsModule-4deb3fbd09764aad2bef35854a55c0627c204b1729d4451998def5096a5cddf653ea89599d028cd39c2df26eb07e277acab462218167a20490c67b5680474e9f"' : 'data-bs-target="#xs-injectables-links-module-DocumentsModule-4deb3fbd09764aad2bef35854a55c0627c204b1729d4451998def5096a5cddf653ea89599d028cd39c2df26eb07e277acab462218167a20490c67b5680474e9f"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-DocumentsModule-4deb3fbd09764aad2bef35854a55c0627c204b1729d4451998def5096a5cddf653ea89599d028cd39c2df26eb07e277acab462218167a20490c67b5680474e9f"' :
                                        'id="xs-injectables-links-module-DocumentsModule-4deb3fbd09764aad2bef35854a55c0627c204b1729d4451998def5096a5cddf653ea89599d028cd39c2df26eb07e277acab462218167a20490c67b5680474e9f"' }>
                                        <li class="link">
                                            <a href="injectables/DocumentsSeederService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DocumentsSeederService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/DocumentsService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DocumentsService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/DriversModule.html" data-type="entity-link" >DriversModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-DriversModule-d8214edb100f5fa955a16f2584692f33be2ba16416cb62f98fc76d5fdb05cf938fae7139fe6f5b2eb24c3e7fff5da5b0b706c7cd5593668327174e2de995bb3f"' : 'data-bs-target="#xs-controllers-links-module-DriversModule-d8214edb100f5fa955a16f2584692f33be2ba16416cb62f98fc76d5fdb05cf938fae7139fe6f5b2eb24c3e7fff5da5b0b706c7cd5593668327174e2de995bb3f"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-DriversModule-d8214edb100f5fa955a16f2584692f33be2ba16416cb62f98fc76d5fdb05cf938fae7139fe6f5b2eb24c3e7fff5da5b0b706c7cd5593668327174e2de995bb3f"' :
                                            'id="xs-controllers-links-module-DriversModule-d8214edb100f5fa955a16f2584692f33be2ba16416cb62f98fc76d5fdb05cf938fae7139fe6f5b2eb24c3e7fff5da5b0b706c7cd5593668327174e2de995bb3f"' }>
                                            <li class="link">
                                                <a href="controllers/DriversController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DriversController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-DriversModule-d8214edb100f5fa955a16f2584692f33be2ba16416cb62f98fc76d5fdb05cf938fae7139fe6f5b2eb24c3e7fff5da5b0b706c7cd5593668327174e2de995bb3f"' : 'data-bs-target="#xs-injectables-links-module-DriversModule-d8214edb100f5fa955a16f2584692f33be2ba16416cb62f98fc76d5fdb05cf938fae7139fe6f5b2eb24c3e7fff5da5b0b706c7cd5593668327174e2de995bb3f"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-DriversModule-d8214edb100f5fa955a16f2584692f33be2ba16416cb62f98fc76d5fdb05cf938fae7139fe6f5b2eb24c3e7fff5da5b0b706c7cd5593668327174e2de995bb3f"' :
                                        'id="xs-injectables-links-module-DriversModule-d8214edb100f5fa955a16f2584692f33be2ba16416cb62f98fc76d5fdb05cf938fae7139fe6f5b2eb24c3e7fff5da5b0b706c7cd5593668327174e2de995bb3f"' }>
                                        <li class="link">
                                            <a href="injectables/DriversService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DriversService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/EmailTemplatesModule.html" data-type="entity-link" >EmailTemplatesModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-EmailTemplatesModule-75623e111595b6f98165086768f252b26875072b0a947d70d9bc3b9832daee1e11d22d6e903727add4fe2239891d66be697c8919f4cd06caf2f7c28d2fae280e"' : 'data-bs-target="#xs-controllers-links-module-EmailTemplatesModule-75623e111595b6f98165086768f252b26875072b0a947d70d9bc3b9832daee1e11d22d6e903727add4fe2239891d66be697c8919f4cd06caf2f7c28d2fae280e"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-EmailTemplatesModule-75623e111595b6f98165086768f252b26875072b0a947d70d9bc3b9832daee1e11d22d6e903727add4fe2239891d66be697c8919f4cd06caf2f7c28d2fae280e"' :
                                            'id="xs-controllers-links-module-EmailTemplatesModule-75623e111595b6f98165086768f252b26875072b0a947d70d9bc3b9832daee1e11d22d6e903727add4fe2239891d66be697c8919f4cd06caf2f7c28d2fae280e"' }>
                                            <li class="link">
                                                <a href="controllers/EmailTemplatesController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >EmailTemplatesController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-EmailTemplatesModule-75623e111595b6f98165086768f252b26875072b0a947d70d9bc3b9832daee1e11d22d6e903727add4fe2239891d66be697c8919f4cd06caf2f7c28d2fae280e"' : 'data-bs-target="#xs-injectables-links-module-EmailTemplatesModule-75623e111595b6f98165086768f252b26875072b0a947d70d9bc3b9832daee1e11d22d6e903727add4fe2239891d66be697c8919f4cd06caf2f7c28d2fae280e"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-EmailTemplatesModule-75623e111595b6f98165086768f252b26875072b0a947d70d9bc3b9832daee1e11d22d6e903727add4fe2239891d66be697c8919f4cd06caf2f7c28d2fae280e"' :
                                        'id="xs-injectables-links-module-EmailTemplatesModule-75623e111595b6f98165086768f252b26875072b0a947d70d9bc3b9832daee1e11d22d6e903727add4fe2239891d66be697c8919f4cd06caf2f7c28d2fae280e"' }>
                                        <li class="link">
                                            <a href="injectables/EmailTemplatesService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >EmailTemplatesService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/FavouritesModule.html" data-type="entity-link" >FavouritesModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-FavouritesModule-38ac7c59a21f4bdb4351eac155bd23c015afff8bfe23ae922b4c97b90d0fef54302b929fae9684eb92d4d88e59bdbbd518648b09c2448120f1275504b757e7be"' : 'data-bs-target="#xs-controllers-links-module-FavouritesModule-38ac7c59a21f4bdb4351eac155bd23c015afff8bfe23ae922b4c97b90d0fef54302b929fae9684eb92d4d88e59bdbbd518648b09c2448120f1275504b757e7be"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-FavouritesModule-38ac7c59a21f4bdb4351eac155bd23c015afff8bfe23ae922b4c97b90d0fef54302b929fae9684eb92d4d88e59bdbbd518648b09c2448120f1275504b757e7be"' :
                                            'id="xs-controllers-links-module-FavouritesModule-38ac7c59a21f4bdb4351eac155bd23c015afff8bfe23ae922b4c97b90d0fef54302b929fae9684eb92d4d88e59bdbbd518648b09c2448120f1275504b757e7be"' }>
                                            <li class="link">
                                                <a href="controllers/FavouritesController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FavouritesController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-FavouritesModule-38ac7c59a21f4bdb4351eac155bd23c015afff8bfe23ae922b4c97b90d0fef54302b929fae9684eb92d4d88e59bdbbd518648b09c2448120f1275504b757e7be"' : 'data-bs-target="#xs-injectables-links-module-FavouritesModule-38ac7c59a21f4bdb4351eac155bd23c015afff8bfe23ae922b4c97b90d0fef54302b929fae9684eb92d4d88e59bdbbd518648b09c2448120f1275504b757e7be"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-FavouritesModule-38ac7c59a21f4bdb4351eac155bd23c015afff8bfe23ae922b4c97b90d0fef54302b929fae9684eb92d4d88e59bdbbd518648b09c2448120f1275504b757e7be"' :
                                        'id="xs-injectables-links-module-FavouritesModule-38ac7c59a21f4bdb4351eac155bd23c015afff8bfe23ae922b4c97b90d0fef54302b929fae9684eb92d4d88e59bdbbd518648b09c2448120f1275504b757e7be"' }>
                                        <li class="link">
                                            <a href="injectables/FavouritesService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FavouritesService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/GiftCardsModule.html" data-type="entity-link" >GiftCardsModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-GiftCardsModule-54f75c6fb89d15b29aa2134598538cb9274f6fca53d8855ad78362a65ac172b40273fe993a4c3d0145af248a5b567e2071516758243a185591883658d69843ce"' : 'data-bs-target="#xs-controllers-links-module-GiftCardsModule-54f75c6fb89d15b29aa2134598538cb9274f6fca53d8855ad78362a65ac172b40273fe993a4c3d0145af248a5b567e2071516758243a185591883658d69843ce"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-GiftCardsModule-54f75c6fb89d15b29aa2134598538cb9274f6fca53d8855ad78362a65ac172b40273fe993a4c3d0145af248a5b567e2071516758243a185591883658d69843ce"' :
                                            'id="xs-controllers-links-module-GiftCardsModule-54f75c6fb89d15b29aa2134598538cb9274f6fca53d8855ad78362a65ac172b40273fe993a4c3d0145af248a5b567e2071516758243a185591883658d69843ce"' }>
                                            <li class="link">
                                                <a href="controllers/GiftCardsController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >GiftCardsController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-GiftCardsModule-54f75c6fb89d15b29aa2134598538cb9274f6fca53d8855ad78362a65ac172b40273fe993a4c3d0145af248a5b567e2071516758243a185591883658d69843ce"' : 'data-bs-target="#xs-injectables-links-module-GiftCardsModule-54f75c6fb89d15b29aa2134598538cb9274f6fca53d8855ad78362a65ac172b40273fe993a4c3d0145af248a5b567e2071516758243a185591883658d69843ce"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-GiftCardsModule-54f75c6fb89d15b29aa2134598538cb9274f6fca53d8855ad78362a65ac172b40273fe993a4c3d0145af248a5b567e2071516758243a185591883658d69843ce"' :
                                        'id="xs-injectables-links-module-GiftCardsModule-54f75c6fb89d15b29aa2134598538cb9274f6fca53d8855ad78362a65ac172b40273fe993a4c3d0145af248a5b567e2071516758243a185591883658d69843ce"' }>
                                        <li class="link">
                                            <a href="injectables/GiftCardsService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >GiftCardsService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/LanguagesModule.html" data-type="entity-link" >LanguagesModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-LanguagesModule-fc33d2d276677bd9106eba9c1a8c89e61aa0a96494736c6859ac349238db855054a3a8cb3cf1b5b2a227bcd8a04600e5baf2cd119f82b8bdcd866b6063af03e2"' : 'data-bs-target="#xs-controllers-links-module-LanguagesModule-fc33d2d276677bd9106eba9c1a8c89e61aa0a96494736c6859ac349238db855054a3a8cb3cf1b5b2a227bcd8a04600e5baf2cd119f82b8bdcd866b6063af03e2"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-LanguagesModule-fc33d2d276677bd9106eba9c1a8c89e61aa0a96494736c6859ac349238db855054a3a8cb3cf1b5b2a227bcd8a04600e5baf2cd119f82b8bdcd866b6063af03e2"' :
                                            'id="xs-controllers-links-module-LanguagesModule-fc33d2d276677bd9106eba9c1a8c89e61aa0a96494736c6859ac349238db855054a3a8cb3cf1b5b2a227bcd8a04600e5baf2cd119f82b8bdcd866b6063af03e2"' }>
                                            <li class="link">
                                                <a href="controllers/LanguagesController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LanguagesController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-LanguagesModule-fc33d2d276677bd9106eba9c1a8c89e61aa0a96494736c6859ac349238db855054a3a8cb3cf1b5b2a227bcd8a04600e5baf2cd119f82b8bdcd866b6063af03e2"' : 'data-bs-target="#xs-injectables-links-module-LanguagesModule-fc33d2d276677bd9106eba9c1a8c89e61aa0a96494736c6859ac349238db855054a3a8cb3cf1b5b2a227bcd8a04600e5baf2cd119f82b8bdcd866b6063af03e2"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-LanguagesModule-fc33d2d276677bd9106eba9c1a8c89e61aa0a96494736c6859ac349238db855054a3a8cb3cf1b5b2a227bcd8a04600e5baf2cd119f82b8bdcd866b6063af03e2"' :
                                        'id="xs-injectables-links-module-LanguagesModule-fc33d2d276677bd9106eba9c1a8c89e61aa0a96494736c6859ac349238db855054a3a8cb3cf1b5b2a227bcd8a04600e5baf2cd119f82b8bdcd866b6063af03e2"' }>
                                        <li class="link">
                                            <a href="injectables/LanguagesSeederService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LanguagesSeederService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/LanguagesService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LanguagesService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/MapsModule.html" data-type="entity-link" >MapsModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-MapsModule-2c3329c8622ada59221f4b538efe0fdfd45d38111b3cee03c71aedb965f3680e8278bc47a4ddfabfced0c400f79a9603b2c53df8a7137e813bc2bb84e0983a17"' : 'data-bs-target="#xs-controllers-links-module-MapsModule-2c3329c8622ada59221f4b538efe0fdfd45d38111b3cee03c71aedb965f3680e8278bc47a4ddfabfced0c400f79a9603b2c53df8a7137e813bc2bb84e0983a17"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-MapsModule-2c3329c8622ada59221f4b538efe0fdfd45d38111b3cee03c71aedb965f3680e8278bc47a4ddfabfced0c400f79a9603b2c53df8a7137e813bc2bb84e0983a17"' :
                                            'id="xs-controllers-links-module-MapsModule-2c3329c8622ada59221f4b538efe0fdfd45d38111b3cee03c71aedb965f3680e8278bc47a4ddfabfced0c400f79a9603b2c53df8a7137e813bc2bb84e0983a17"' }>
                                            <li class="link">
                                                <a href="controllers/MapsController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MapsController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-MapsModule-2c3329c8622ada59221f4b538efe0fdfd45d38111b3cee03c71aedb965f3680e8278bc47a4ddfabfced0c400f79a9603b2c53df8a7137e813bc2bb84e0983a17"' : 'data-bs-target="#xs-injectables-links-module-MapsModule-2c3329c8622ada59221f4b538efe0fdfd45d38111b3cee03c71aedb965f3680e8278bc47a4ddfabfced0c400f79a9603b2c53df8a7137e813bc2bb84e0983a17"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-MapsModule-2c3329c8622ada59221f4b538efe0fdfd45d38111b3cee03c71aedb965f3680e8278bc47a4ddfabfced0c400f79a9603b2c53df8a7137e813bc2bb84e0983a17"' :
                                        'id="xs-injectables-links-module-MapsModule-2c3329c8622ada59221f4b538efe0fdfd45d38111b3cee03c71aedb965f3680e8278bc47a4ddfabfced0c400f79a9603b2c53df8a7137e813bc2bb84e0983a17"' }>
                                        <li class="link">
                                            <a href="injectables/MapsService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MapsService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/NotificationsModule.html" data-type="entity-link" >NotificationsModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-NotificationsModule-3169ec3a07d92ab4b356afb4a81f1ef6b53b47f59be3621bb30fe875066ee5405778c01f1f7f274f3b22d8349b17f5e51860d625c3ad0e60948e7b50d2ce1484"' : 'data-bs-target="#xs-controllers-links-module-NotificationsModule-3169ec3a07d92ab4b356afb4a81f1ef6b53b47f59be3621bb30fe875066ee5405778c01f1f7f274f3b22d8349b17f5e51860d625c3ad0e60948e7b50d2ce1484"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-NotificationsModule-3169ec3a07d92ab4b356afb4a81f1ef6b53b47f59be3621bb30fe875066ee5405778c01f1f7f274f3b22d8349b17f5e51860d625c3ad0e60948e7b50d2ce1484"' :
                                            'id="xs-controllers-links-module-NotificationsModule-3169ec3a07d92ab4b356afb4a81f1ef6b53b47f59be3621bb30fe875066ee5405778c01f1f7f274f3b22d8349b17f5e51860d625c3ad0e60948e7b50d2ce1484"' }>
                                            <li class="link">
                                                <a href="controllers/NotificationsController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >NotificationsController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-NotificationsModule-3169ec3a07d92ab4b356afb4a81f1ef6b53b47f59be3621bb30fe875066ee5405778c01f1f7f274f3b22d8349b17f5e51860d625c3ad0e60948e7b50d2ce1484"' : 'data-bs-target="#xs-injectables-links-module-NotificationsModule-3169ec3a07d92ab4b356afb4a81f1ef6b53b47f59be3621bb30fe875066ee5405778c01f1f7f274f3b22d8349b17f5e51860d625c3ad0e60948e7b50d2ce1484"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-NotificationsModule-3169ec3a07d92ab4b356afb4a81f1ef6b53b47f59be3621bb30fe875066ee5405778c01f1f7f274f3b22d8349b17f5e51860d625c3ad0e60948e7b50d2ce1484"' :
                                        'id="xs-injectables-links-module-NotificationsModule-3169ec3a07d92ab4b356afb4a81f1ef6b53b47f59be3621bb30fe875066ee5405778c01f1f7f274f3b22d8349b17f5e51860d625c3ad0e60948e7b50d2ce1484"' }>
                                        <li class="link">
                                            <a href="injectables/NotificationsService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >NotificationsService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/OnBoardingModule.html" data-type="entity-link" >OnBoardingModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-OnBoardingModule-f32666dcd94fb5c6119ab47ec53e8477c211b126d6eebb2fcf37771553e4a84e1c72e3ff45174052418ebe2955983eb9379321cadbaff10115a8176d2ebbb307"' : 'data-bs-target="#xs-controllers-links-module-OnBoardingModule-f32666dcd94fb5c6119ab47ec53e8477c211b126d6eebb2fcf37771553e4a84e1c72e3ff45174052418ebe2955983eb9379321cadbaff10115a8176d2ebbb307"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-OnBoardingModule-f32666dcd94fb5c6119ab47ec53e8477c211b126d6eebb2fcf37771553e4a84e1c72e3ff45174052418ebe2955983eb9379321cadbaff10115a8176d2ebbb307"' :
                                            'id="xs-controllers-links-module-OnBoardingModule-f32666dcd94fb5c6119ab47ec53e8477c211b126d6eebb2fcf37771553e4a84e1c72e3ff45174052418ebe2955983eb9379321cadbaff10115a8176d2ebbb307"' }>
                                            <li class="link">
                                                <a href="controllers/OnBoardingController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >OnBoardingController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-OnBoardingModule-f32666dcd94fb5c6119ab47ec53e8477c211b126d6eebb2fcf37771553e4a84e1c72e3ff45174052418ebe2955983eb9379321cadbaff10115a8176d2ebbb307"' : 'data-bs-target="#xs-injectables-links-module-OnBoardingModule-f32666dcd94fb5c6119ab47ec53e8477c211b126d6eebb2fcf37771553e4a84e1c72e3ff45174052418ebe2955983eb9379321cadbaff10115a8176d2ebbb307"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-OnBoardingModule-f32666dcd94fb5c6119ab47ec53e8477c211b126d6eebb2fcf37771553e4a84e1c72e3ff45174052418ebe2955983eb9379321cadbaff10115a8176d2ebbb307"' :
                                        'id="xs-injectables-links-module-OnBoardingModule-f32666dcd94fb5c6119ab47ec53e8477c211b126d6eebb2fcf37771553e4a84e1c72e3ff45174052418ebe2955983eb9379321cadbaff10115a8176d2ebbb307"' }>
                                        <li class="link">
                                            <a href="injectables/OnBoardingService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >OnBoardingService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/OrdersModule.html" data-type="entity-link" >OrdersModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-OrdersModule-893b0294215eb78c2330bef7e55c5ce9ef59856216baeb8b43114cb54007e1ed1505e2f53c8253c7b74ac08af2f0052c911e827c5a8477c081aa8cf4d8fbd373"' : 'data-bs-target="#xs-controllers-links-module-OrdersModule-893b0294215eb78c2330bef7e55c5ce9ef59856216baeb8b43114cb54007e1ed1505e2f53c8253c7b74ac08af2f0052c911e827c5a8477c081aa8cf4d8fbd373"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-OrdersModule-893b0294215eb78c2330bef7e55c5ce9ef59856216baeb8b43114cb54007e1ed1505e2f53c8253c7b74ac08af2f0052c911e827c5a8477c081aa8cf4d8fbd373"' :
                                            'id="xs-controllers-links-module-OrdersModule-893b0294215eb78c2330bef7e55c5ce9ef59856216baeb8b43114cb54007e1ed1505e2f53c8253c7b74ac08af2f0052c911e827c5a8477c081aa8cf4d8fbd373"' }>
                                            <li class="link">
                                                <a href="controllers/OrdersController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >OrdersController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-OrdersModule-893b0294215eb78c2330bef7e55c5ce9ef59856216baeb8b43114cb54007e1ed1505e2f53c8253c7b74ac08af2f0052c911e827c5a8477c081aa8cf4d8fbd373"' : 'data-bs-target="#xs-injectables-links-module-OrdersModule-893b0294215eb78c2330bef7e55c5ce9ef59856216baeb8b43114cb54007e1ed1505e2f53c8253c7b74ac08af2f0052c911e827c5a8477c081aa8cf4d8fbd373"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-OrdersModule-893b0294215eb78c2330bef7e55c5ce9ef59856216baeb8b43114cb54007e1ed1505e2f53c8253c7b74ac08af2f0052c911e827c5a8477c081aa8cf4d8fbd373"' :
                                        'id="xs-injectables-links-module-OrdersModule-893b0294215eb78c2330bef7e55c5ce9ef59856216baeb8b43114cb54007e1ed1505e2f53c8253c7b74ac08af2f0052c911e827c5a8477c081aa8cf4d8fbd373"' }>
                                        <li class="link">
                                            <a href="injectables/OrdersService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >OrdersService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/PaymentModule.html" data-type="entity-link" >PaymentModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-PaymentModule-a6091fe33502ee5e050605479c4077aa758b6bc679cfe7cb6c7f141a03e0e5f16bb5235fbd195c4ebf367eaf7dbd5156fee20f26ef6c559f6046579ccc4de5d3"' : 'data-bs-target="#xs-controllers-links-module-PaymentModule-a6091fe33502ee5e050605479c4077aa758b6bc679cfe7cb6c7f141a03e0e5f16bb5235fbd195c4ebf367eaf7dbd5156fee20f26ef6c559f6046579ccc4de5d3"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-PaymentModule-a6091fe33502ee5e050605479c4077aa758b6bc679cfe7cb6c7f141a03e0e5f16bb5235fbd195c4ebf367eaf7dbd5156fee20f26ef6c559f6046579ccc4de5d3"' :
                                            'id="xs-controllers-links-module-PaymentModule-a6091fe33502ee5e050605479c4077aa758b6bc679cfe7cb6c7f141a03e0e5f16bb5235fbd195c4ebf367eaf7dbd5156fee20f26ef6c559f6046579ccc4de5d3"' }>
                                            <li class="link">
                                                <a href="controllers/PaymentController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PaymentController</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/PrismaModule.html" data-type="entity-link" >PrismaModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-PrismaModule-7ec46d5213648d6af195ca52dfa87b1c4755e5bf4d88e606af4a6f96fffe160393eacdce8d2a5e5c86609ba2e65e54573d9bd60b03145287dbc37bed02a6aff4"' : 'data-bs-target="#xs-injectables-links-module-PrismaModule-7ec46d5213648d6af195ca52dfa87b1c4755e5bf4d88e606af4a6f96fffe160393eacdce8d2a5e5c86609ba2e65e54573d9bd60b03145287dbc37bed02a6aff4"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-PrismaModule-7ec46d5213648d6af195ca52dfa87b1c4755e5bf4d88e606af4a6f96fffe160393eacdce8d2a5e5c86609ba2e65e54573d9bd60b03145287dbc37bed02a6aff4"' :
                                        'id="xs-injectables-links-module-PrismaModule-7ec46d5213648d6af195ca52dfa87b1c4755e5bf4d88e606af4a6f96fffe160393eacdce8d2a5e5c86609ba2e65e54573d9bd60b03145287dbc37bed02a6aff4"' }>
                                        <li class="link">
                                            <a href="injectables/PrismaService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PrismaService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/ProductsModule.html" data-type="entity-link" >ProductsModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-ProductsModule-ea7262032c356950c38b5f6ef21ae847a41dde193c82790a730f04c2e4c2f82145d0dfd67a9878a4ef62dabcedcf4261e7640e94b51c0d3215b2ea9f02d04464"' : 'data-bs-target="#xs-controllers-links-module-ProductsModule-ea7262032c356950c38b5f6ef21ae847a41dde193c82790a730f04c2e4c2f82145d0dfd67a9878a4ef62dabcedcf4261e7640e94b51c0d3215b2ea9f02d04464"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-ProductsModule-ea7262032c356950c38b5f6ef21ae847a41dde193c82790a730f04c2e4c2f82145d0dfd67a9878a4ef62dabcedcf4261e7640e94b51c0d3215b2ea9f02d04464"' :
                                            'id="xs-controllers-links-module-ProductsModule-ea7262032c356950c38b5f6ef21ae847a41dde193c82790a730f04c2e4c2f82145d0dfd67a9878a4ef62dabcedcf4261e7640e94b51c0d3215b2ea9f02d04464"' }>
                                            <li class="link">
                                                <a href="controllers/ProductsController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ProductsController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-ProductsModule-ea7262032c356950c38b5f6ef21ae847a41dde193c82790a730f04c2e4c2f82145d0dfd67a9878a4ef62dabcedcf4261e7640e94b51c0d3215b2ea9f02d04464"' : 'data-bs-target="#xs-injectables-links-module-ProductsModule-ea7262032c356950c38b5f6ef21ae847a41dde193c82790a730f04c2e4c2f82145d0dfd67a9878a4ef62dabcedcf4261e7640e94b51c0d3215b2ea9f02d04464"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-ProductsModule-ea7262032c356950c38b5f6ef21ae847a41dde193c82790a730f04c2e4c2f82145d0dfd67a9878a4ef62dabcedcf4261e7640e94b51c0d3215b2ea9f02d04464"' :
                                        'id="xs-injectables-links-module-ProductsModule-ea7262032c356950c38b5f6ef21ae847a41dde193c82790a730f04c2e4c2f82145d0dfd67a9878a4ef62dabcedcf4261e7640e94b51c0d3215b2ea9f02d04464"' }>
                                        <li class="link">
                                            <a href="injectables/ProductsService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ProductsService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/ReferralsModule.html" data-type="entity-link" >ReferralsModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-ReferralsModule-464c2a694c69f6ddadec8651f20469212b9cb0aa6d219f3a90c2966615d3aa89cbdecca0eb83f4d9d098e20461f50396c0b8bdd5e7558fd2da3ed5a3ddca93c2"' : 'data-bs-target="#xs-controllers-links-module-ReferralsModule-464c2a694c69f6ddadec8651f20469212b9cb0aa6d219f3a90c2966615d3aa89cbdecca0eb83f4d9d098e20461f50396c0b8bdd5e7558fd2da3ed5a3ddca93c2"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-ReferralsModule-464c2a694c69f6ddadec8651f20469212b9cb0aa6d219f3a90c2966615d3aa89cbdecca0eb83f4d9d098e20461f50396c0b8bdd5e7558fd2da3ed5a3ddca93c2"' :
                                            'id="xs-controllers-links-module-ReferralsModule-464c2a694c69f6ddadec8651f20469212b9cb0aa6d219f3a90c2966615d3aa89cbdecca0eb83f4d9d098e20461f50396c0b8bdd5e7558fd2da3ed5a3ddca93c2"' }>
                                            <li class="link">
                                                <a href="controllers/ReferralsController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ReferralsController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-ReferralsModule-464c2a694c69f6ddadec8651f20469212b9cb0aa6d219f3a90c2966615d3aa89cbdecca0eb83f4d9d098e20461f50396c0b8bdd5e7558fd2da3ed5a3ddca93c2"' : 'data-bs-target="#xs-injectables-links-module-ReferralsModule-464c2a694c69f6ddadec8651f20469212b9cb0aa6d219f3a90c2966615d3aa89cbdecca0eb83f4d9d098e20461f50396c0b8bdd5e7558fd2da3ed5a3ddca93c2"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-ReferralsModule-464c2a694c69f6ddadec8651f20469212b9cb0aa6d219f3a90c2966615d3aa89cbdecca0eb83f4d9d098e20461f50396c0b8bdd5e7558fd2da3ed5a3ddca93c2"' :
                                        'id="xs-injectables-links-module-ReferralsModule-464c2a694c69f6ddadec8651f20469212b9cb0aa6d219f3a90c2966615d3aa89cbdecca0eb83f4d9d098e20461f50396c0b8bdd5e7558fd2da3ed5a3ddca93c2"' }>
                                        <li class="link">
                                            <a href="injectables/ReferralsService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ReferralsService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/ReviewAttributesModule.html" data-type="entity-link" >ReviewAttributesModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-ReviewAttributesModule-5c4fb360b59753f8c31cbfa39d39cc0df5d0dd71797e85791cfab27363817ebf6c26cac59783a6c72b085563b1a1f4b533ab5b12f35f62420361dd1d6fc7ebd0"' : 'data-bs-target="#xs-controllers-links-module-ReviewAttributesModule-5c4fb360b59753f8c31cbfa39d39cc0df5d0dd71797e85791cfab27363817ebf6c26cac59783a6c72b085563b1a1f4b533ab5b12f35f62420361dd1d6fc7ebd0"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-ReviewAttributesModule-5c4fb360b59753f8c31cbfa39d39cc0df5d0dd71797e85791cfab27363817ebf6c26cac59783a6c72b085563b1a1f4b533ab5b12f35f62420361dd1d6fc7ebd0"' :
                                            'id="xs-controllers-links-module-ReviewAttributesModule-5c4fb360b59753f8c31cbfa39d39cc0df5d0dd71797e85791cfab27363817ebf6c26cac59783a6c72b085563b1a1f4b533ab5b12f35f62420361dd1d6fc7ebd0"' }>
                                            <li class="link">
                                                <a href="controllers/ReviewAttributesController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ReviewAttributesController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-ReviewAttributesModule-5c4fb360b59753f8c31cbfa39d39cc0df5d0dd71797e85791cfab27363817ebf6c26cac59783a6c72b085563b1a1f4b533ab5b12f35f62420361dd1d6fc7ebd0"' : 'data-bs-target="#xs-injectables-links-module-ReviewAttributesModule-5c4fb360b59753f8c31cbfa39d39cc0df5d0dd71797e85791cfab27363817ebf6c26cac59783a6c72b085563b1a1f4b533ab5b12f35f62420361dd1d6fc7ebd0"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-ReviewAttributesModule-5c4fb360b59753f8c31cbfa39d39cc0df5d0dd71797e85791cfab27363817ebf6c26cac59783a6c72b085563b1a1f4b533ab5b12f35f62420361dd1d6fc7ebd0"' :
                                        'id="xs-injectables-links-module-ReviewAttributesModule-5c4fb360b59753f8c31cbfa39d39cc0df5d0dd71797e85791cfab27363817ebf6c26cac59783a6c72b085563b1a1f4b533ab5b12f35f62420361dd1d6fc7ebd0"' }>
                                        <li class="link">
                                            <a href="injectables/ReviewAttributesService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ReviewAttributesService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/ReviewsModule.html" data-type="entity-link" >ReviewsModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-ReviewsModule-b90960d625d50d8c921407686fb9b5a79593c5746a41aba2a30050d0372772925cdb6cffc3cdd72ad3b35aa56f4ddefebc4dda9f4407db2d592403557abcc0aa"' : 'data-bs-target="#xs-controllers-links-module-ReviewsModule-b90960d625d50d8c921407686fb9b5a79593c5746a41aba2a30050d0372772925cdb6cffc3cdd72ad3b35aa56f4ddefebc4dda9f4407db2d592403557abcc0aa"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-ReviewsModule-b90960d625d50d8c921407686fb9b5a79593c5746a41aba2a30050d0372772925cdb6cffc3cdd72ad3b35aa56f4ddefebc4dda9f4407db2d592403557abcc0aa"' :
                                            'id="xs-controllers-links-module-ReviewsModule-b90960d625d50d8c921407686fb9b5a79593c5746a41aba2a30050d0372772925cdb6cffc3cdd72ad3b35aa56f4ddefebc4dda9f4407db2d592403557abcc0aa"' }>
                                            <li class="link">
                                                <a href="controllers/ReviewsController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ReviewsController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-ReviewsModule-b90960d625d50d8c921407686fb9b5a79593c5746a41aba2a30050d0372772925cdb6cffc3cdd72ad3b35aa56f4ddefebc4dda9f4407db2d592403557abcc0aa"' : 'data-bs-target="#xs-injectables-links-module-ReviewsModule-b90960d625d50d8c921407686fb9b5a79593c5746a41aba2a30050d0372772925cdb6cffc3cdd72ad3b35aa56f4ddefebc4dda9f4407db2d592403557abcc0aa"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-ReviewsModule-b90960d625d50d8c921407686fb9b5a79593c5746a41aba2a30050d0372772925cdb6cffc3cdd72ad3b35aa56f4ddefebc4dda9f4407db2d592403557abcc0aa"' :
                                        'id="xs-injectables-links-module-ReviewsModule-b90960d625d50d8c921407686fb9b5a79593c5746a41aba2a30050d0372772925cdb6cffc3cdd72ad3b35aa56f4ddefebc4dda9f4407db2d592403557abcc0aa"' }>
                                        <li class="link">
                                            <a href="injectables/ReviewsService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ReviewsService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/SearchModule.html" data-type="entity-link" >SearchModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-SearchModule-0df0b856f0ded03e37da0cb86fc38b5f79984ffef28c9120d7c7771473975da76e476d708cc4a9c5b4ed41d35f95db289ab77c5e5123fd6eaa2a945c65bcdfcd"' : 'data-bs-target="#xs-controllers-links-module-SearchModule-0df0b856f0ded03e37da0cb86fc38b5f79984ffef28c9120d7c7771473975da76e476d708cc4a9c5b4ed41d35f95db289ab77c5e5123fd6eaa2a945c65bcdfcd"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-SearchModule-0df0b856f0ded03e37da0cb86fc38b5f79984ffef28c9120d7c7771473975da76e476d708cc4a9c5b4ed41d35f95db289ab77c5e5123fd6eaa2a945c65bcdfcd"' :
                                            'id="xs-controllers-links-module-SearchModule-0df0b856f0ded03e37da0cb86fc38b5f79984ffef28c9120d7c7771473975da76e476d708cc4a9c5b4ed41d35f95db289ab77c5e5123fd6eaa2a945c65bcdfcd"' }>
                                            <li class="link">
                                                <a href="controllers/SearchController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SearchController</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/SettingsModule.html" data-type="entity-link" >SettingsModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-SettingsModule-17beaeeaa3b5d07fbb50bc736a497e2a88cf0dd7cbfdeec3eeb603a0f6eff1cf0f34898ff07aa46cdde6027f36a008de69edfbda6764e78063c5fcfed4f94b3f"' : 'data-bs-target="#xs-controllers-links-module-SettingsModule-17beaeeaa3b5d07fbb50bc736a497e2a88cf0dd7cbfdeec3eeb603a0f6eff1cf0f34898ff07aa46cdde6027f36a008de69edfbda6764e78063c5fcfed4f94b3f"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-SettingsModule-17beaeeaa3b5d07fbb50bc736a497e2a88cf0dd7cbfdeec3eeb603a0f6eff1cf0f34898ff07aa46cdde6027f36a008de69edfbda6764e78063c5fcfed4f94b3f"' :
                                            'id="xs-controllers-links-module-SettingsModule-17beaeeaa3b5d07fbb50bc736a497e2a88cf0dd7cbfdeec3eeb603a0f6eff1cf0f34898ff07aa46cdde6027f36a008de69edfbda6764e78063c5fcfed4f94b3f"' }>
                                            <li class="link">
                                                <a href="controllers/SettingsController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SettingsController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-SettingsModule-17beaeeaa3b5d07fbb50bc736a497e2a88cf0dd7cbfdeec3eeb603a0f6eff1cf0f34898ff07aa46cdde6027f36a008de69edfbda6764e78063c5fcfed4f94b3f"' : 'data-bs-target="#xs-injectables-links-module-SettingsModule-17beaeeaa3b5d07fbb50bc736a497e2a88cf0dd7cbfdeec3eeb603a0f6eff1cf0f34898ff07aa46cdde6027f36a008de69edfbda6764e78063c5fcfed4f94b3f"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-SettingsModule-17beaeeaa3b5d07fbb50bc736a497e2a88cf0dd7cbfdeec3eeb603a0f6eff1cf0f34898ff07aa46cdde6027f36a008de69edfbda6764e78063c5fcfed4f94b3f"' :
                                        'id="xs-injectables-links-module-SettingsModule-17beaeeaa3b5d07fbb50bc736a497e2a88cf0dd7cbfdeec3eeb603a0f6eff1cf0f34898ff07aa46cdde6027f36a008de69edfbda6764e78063c5fcfed4f94b3f"' }>
                                        <li class="link">
                                            <a href="injectables/SettingsSeederService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SettingsSeederService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/SettingsService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SettingsService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/SharedModule.html" data-type="entity-link" >SharedModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-SharedModule-e44daa907961c5f22e395bf4bf881822ae655cd46ba6def1fe44c31c1bd7fa1a46246e047a6587608493d01f711c4bbf8670a16a5789dcca19690f4ca6139f0d"' : 'data-bs-target="#xs-injectables-links-module-SharedModule-e44daa907961c5f22e395bf4bf881822ae655cd46ba6def1fe44c31c1bd7fa1a46246e047a6587608493d01f711c4bbf8670a16a5789dcca19690f4ca6139f0d"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-SharedModule-e44daa907961c5f22e395bf4bf881822ae655cd46ba6def1fe44c31c1bd7fa1a46246e047a6587608493d01f711c4bbf8670a16a5789dcca19690f4ca6139f0d"' :
                                        'id="xs-injectables-links-module-SharedModule-e44daa907961c5f22e395bf4bf881822ae655cd46ba6def1fe44c31c1bd7fa1a46246e047a6587608493d01f711c4bbf8670a16a5789dcca19690f4ca6139f0d"' }>
                                        <li class="link">
                                            <a href="injectables/EmailService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >EmailService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/FcmService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FcmService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/FileStorageService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FileStorageService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/GeolocationService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >GeolocationService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/NotificationService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >NotificationService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/PaymentService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PaymentService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/RedisService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >RedisService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/SmsService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SmsService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/StoriesModule.html" data-type="entity-link" >StoriesModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-StoriesModule-df645ed3ddf055eb33102bdb78f5f4a218e8fd7b3be0ae9471abad4e83e36f449ebbcf34a2b5d81b632218f5515fa19840f1c065410e5bd165b333fd9534b95c"' : 'data-bs-target="#xs-controllers-links-module-StoriesModule-df645ed3ddf055eb33102bdb78f5f4a218e8fd7b3be0ae9471abad4e83e36f449ebbcf34a2b5d81b632218f5515fa19840f1c065410e5bd165b333fd9534b95c"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-StoriesModule-df645ed3ddf055eb33102bdb78f5f4a218e8fd7b3be0ae9471abad4e83e36f449ebbcf34a2b5d81b632218f5515fa19840f1c065410e5bd165b333fd9534b95c"' :
                                            'id="xs-controllers-links-module-StoriesModule-df645ed3ddf055eb33102bdb78f5f4a218e8fd7b3be0ae9471abad4e83e36f449ebbcf34a2b5d81b632218f5515fa19840f1c065410e5bd165b333fd9534b95c"' }>
                                            <li class="link">
                                                <a href="controllers/StoriesController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >StoriesController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-StoriesModule-df645ed3ddf055eb33102bdb78f5f4a218e8fd7b3be0ae9471abad4e83e36f449ebbcf34a2b5d81b632218f5515fa19840f1c065410e5bd165b333fd9534b95c"' : 'data-bs-target="#xs-injectables-links-module-StoriesModule-df645ed3ddf055eb33102bdb78f5f4a218e8fd7b3be0ae9471abad4e83e36f449ebbcf34a2b5d81b632218f5515fa19840f1c065410e5bd165b333fd9534b95c"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-StoriesModule-df645ed3ddf055eb33102bdb78f5f4a218e8fd7b3be0ae9471abad4e83e36f449ebbcf34a2b5d81b632218f5515fa19840f1c065410e5bd165b333fd9534b95c"' :
                                        'id="xs-injectables-links-module-StoriesModule-df645ed3ddf055eb33102bdb78f5f4a218e8fd7b3be0ae9471abad4e83e36f449ebbcf34a2b5d81b632218f5515fa19840f1c065410e5bd165b333fd9534b95c"' }>
                                        <li class="link">
                                            <a href="injectables/StoriesService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >StoriesService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/SubscriptionsModule.html" data-type="entity-link" >SubscriptionsModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-SubscriptionsModule-d462f9766a6ba6994c14e2d4e97fb7444b750ae3e55b9d457ebe2bc6247f7a7d4e209ee442196f7cb053de0003b15198b58e8ae65dbce2833f92dce4648415e1"' : 'data-bs-target="#xs-controllers-links-module-SubscriptionsModule-d462f9766a6ba6994c14e2d4e97fb7444b750ae3e55b9d457ebe2bc6247f7a7d4e209ee442196f7cb053de0003b15198b58e8ae65dbce2833f92dce4648415e1"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-SubscriptionsModule-d462f9766a6ba6994c14e2d4e97fb7444b750ae3e55b9d457ebe2bc6247f7a7d4e209ee442196f7cb053de0003b15198b58e8ae65dbce2833f92dce4648415e1"' :
                                            'id="xs-controllers-links-module-SubscriptionsModule-d462f9766a6ba6994c14e2d4e97fb7444b750ae3e55b9d457ebe2bc6247f7a7d4e209ee442196f7cb053de0003b15198b58e8ae65dbce2833f92dce4648415e1"' }>
                                            <li class="link">
                                                <a href="controllers/SubscriptionsController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SubscriptionsController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-SubscriptionsModule-d462f9766a6ba6994c14e2d4e97fb7444b750ae3e55b9d457ebe2bc6247f7a7d4e209ee442196f7cb053de0003b15198b58e8ae65dbce2833f92dce4648415e1"' : 'data-bs-target="#xs-injectables-links-module-SubscriptionsModule-d462f9766a6ba6994c14e2d4e97fb7444b750ae3e55b9d457ebe2bc6247f7a7d4e209ee442196f7cb053de0003b15198b58e8ae65dbce2833f92dce4648415e1"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-SubscriptionsModule-d462f9766a6ba6994c14e2d4e97fb7444b750ae3e55b9d457ebe2bc6247f7a7d4e209ee442196f7cb053de0003b15198b58e8ae65dbce2833f92dce4648415e1"' :
                                        'id="xs-injectables-links-module-SubscriptionsModule-d462f9766a6ba6994c14e2d4e97fb7444b750ae3e55b9d457ebe2bc6247f7a7d4e209ee442196f7cb053de0003b15198b58e8ae65dbce2833f92dce4648415e1"' }>
                                        <li class="link">
                                            <a href="injectables/SubscriptionsService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SubscriptionsService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/SupportModule.html" data-type="entity-link" >SupportModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-SupportModule-4d4b01fea4dca319316084e34010d489dcdb6632971d539a7b650172d2bee5417fd8307d5d5767bfa75ee9f82b2eaa1f9be22316728b9c1110caead23a054197"' : 'data-bs-target="#xs-controllers-links-module-SupportModule-4d4b01fea4dca319316084e34010d489dcdb6632971d539a7b650172d2bee5417fd8307d5d5767bfa75ee9f82b2eaa1f9be22316728b9c1110caead23a054197"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-SupportModule-4d4b01fea4dca319316084e34010d489dcdb6632971d539a7b650172d2bee5417fd8307d5d5767bfa75ee9f82b2eaa1f9be22316728b9c1110caead23a054197"' :
                                            'id="xs-controllers-links-module-SupportModule-4d4b01fea4dca319316084e34010d489dcdb6632971d539a7b650172d2bee5417fd8307d5d5767bfa75ee9f82b2eaa1f9be22316728b9c1110caead23a054197"' }>
                                            <li class="link">
                                                <a href="controllers/SupportController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SupportController</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/TaxesModule.html" data-type="entity-link" >TaxesModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-TaxesModule-06f744f4ce9ec9db40c2908963e29b08b031633f985ff733d0179d80b95a3c3abadae69822af817c41438f559dcd4df0c01cc74800cb7be00aae577d9f3b2ab7"' : 'data-bs-target="#xs-controllers-links-module-TaxesModule-06f744f4ce9ec9db40c2908963e29b08b031633f985ff733d0179d80b95a3c3abadae69822af817c41438f559dcd4df0c01cc74800cb7be00aae577d9f3b2ab7"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-TaxesModule-06f744f4ce9ec9db40c2908963e29b08b031633f985ff733d0179d80b95a3c3abadae69822af817c41438f559dcd4df0c01cc74800cb7be00aae577d9f3b2ab7"' :
                                            'id="xs-controllers-links-module-TaxesModule-06f744f4ce9ec9db40c2908963e29b08b031633f985ff733d0179d80b95a3c3abadae69822af817c41438f559dcd4df0c01cc74800cb7be00aae577d9f3b2ab7"' }>
                                            <li class="link">
                                                <a href="controllers/TaxesController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TaxesController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-TaxesModule-06f744f4ce9ec9db40c2908963e29b08b031633f985ff733d0179d80b95a3c3abadae69822af817c41438f559dcd4df0c01cc74800cb7be00aae577d9f3b2ab7"' : 'data-bs-target="#xs-injectables-links-module-TaxesModule-06f744f4ce9ec9db40c2908963e29b08b031633f985ff733d0179d80b95a3c3abadae69822af817c41438f559dcd4df0c01cc74800cb7be00aae577d9f3b2ab7"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-TaxesModule-06f744f4ce9ec9db40c2908963e29b08b031633f985ff733d0179d80b95a3c3abadae69822af817c41438f559dcd4df0c01cc74800cb7be00aae577d9f3b2ab7"' :
                                        'id="xs-injectables-links-module-TaxesModule-06f744f4ce9ec9db40c2908963e29b08b031633f985ff733d0179d80b95a3c3abadae69822af817c41438f559dcd4df0c01cc74800cb7be00aae577d9f3b2ab7"' }>
                                        <li class="link">
                                            <a href="injectables/TaxesService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TaxesService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/UploadModule.html" data-type="entity-link" >UploadModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-UploadModule-f4e91c4b9eefe1535e5683d7b22e47b5287bf90b4257f7595dc0992a0b4bb82b61762c97302a09aaf382a73630504a3c605223575b4d0e1adf4211ce6ac75417"' : 'data-bs-target="#xs-controllers-links-module-UploadModule-f4e91c4b9eefe1535e5683d7b22e47b5287bf90b4257f7595dc0992a0b4bb82b61762c97302a09aaf382a73630504a3c605223575b4d0e1adf4211ce6ac75417"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-UploadModule-f4e91c4b9eefe1535e5683d7b22e47b5287bf90b4257f7595dc0992a0b4bb82b61762c97302a09aaf382a73630504a3c605223575b4d0e1adf4211ce6ac75417"' :
                                            'id="xs-controllers-links-module-UploadModule-f4e91c4b9eefe1535e5683d7b22e47b5287bf90b4257f7595dc0992a0b4bb82b61762c97302a09aaf382a73630504a3c605223575b4d0e1adf4211ce6ac75417"' }>
                                            <li class="link">
                                                <a href="controllers/UploadController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UploadController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-UploadModule-f4e91c4b9eefe1535e5683d7b22e47b5287bf90b4257f7595dc0992a0b4bb82b61762c97302a09aaf382a73630504a3c605223575b4d0e1adf4211ce6ac75417"' : 'data-bs-target="#xs-injectables-links-module-UploadModule-f4e91c4b9eefe1535e5683d7b22e47b5287bf90b4257f7595dc0992a0b4bb82b61762c97302a09aaf382a73630504a3c605223575b4d0e1adf4211ce6ac75417"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-UploadModule-f4e91c4b9eefe1535e5683d7b22e47b5287bf90b4257f7595dc0992a0b4bb82b61762c97302a09aaf382a73630504a3c605223575b4d0e1adf4211ce6ac75417"' :
                                        'id="xs-injectables-links-module-UploadModule-f4e91c4b9eefe1535e5683d7b22e47b5287bf90b4257f7595dc0992a0b4bb82b61762c97302a09aaf382a73630504a3c605223575b4d0e1adf4211ce6ac75417"' }>
                                        <li class="link">
                                            <a href="injectables/UploadService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UploadService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/UsersModule.html" data-type="entity-link" >UsersModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-UsersModule-18a8fa9719d0a248696664cc4d8f1edfd23732afe221054a8f19e496a1c1377fed6123840438b35f560e6c847352d554ede13836afaa2d73eb5c93950a62de36"' : 'data-bs-target="#xs-controllers-links-module-UsersModule-18a8fa9719d0a248696664cc4d8f1edfd23732afe221054a8f19e496a1c1377fed6123840438b35f560e6c847352d554ede13836afaa2d73eb5c93950a62de36"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-UsersModule-18a8fa9719d0a248696664cc4d8f1edfd23732afe221054a8f19e496a1c1377fed6123840438b35f560e6c847352d554ede13836afaa2d73eb5c93950a62de36"' :
                                            'id="xs-controllers-links-module-UsersModule-18a8fa9719d0a248696664cc4d8f1edfd23732afe221054a8f19e496a1c1377fed6123840438b35f560e6c847352d554ede13836afaa2d73eb5c93950a62de36"' }>
                                            <li class="link">
                                                <a href="controllers/UsersController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UsersController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-UsersModule-18a8fa9719d0a248696664cc4d8f1edfd23732afe221054a8f19e496a1c1377fed6123840438b35f560e6c847352d554ede13836afaa2d73eb5c93950a62de36"' : 'data-bs-target="#xs-injectables-links-module-UsersModule-18a8fa9719d0a248696664cc4d8f1edfd23732afe221054a8f19e496a1c1377fed6123840438b35f560e6c847352d554ede13836afaa2d73eb5c93950a62de36"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-UsersModule-18a8fa9719d0a248696664cc4d8f1edfd23732afe221054a8f19e496a1c1377fed6123840438b35f560e6c847352d554ede13836afaa2d73eb5c93950a62de36"' :
                                        'id="xs-injectables-links-module-UsersModule-18a8fa9719d0a248696664cc4d8f1edfd23732afe221054a8f19e496a1c1377fed6123840438b35f560e6c847352d554ede13836afaa2d73eb5c93950a62de36"' }>
                                        <li class="link">
                                            <a href="injectables/UsersService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UsersService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/VendorsModule.html" data-type="entity-link" >VendorsModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-VendorsModule-36101cf297c6fde903b699348ae8ef0009e109296aabf7624ec94211959f359ddaf8e572381530a2eca8fe38a5c86fed9224661183c91015784b3aadffe5a135"' : 'data-bs-target="#xs-controllers-links-module-VendorsModule-36101cf297c6fde903b699348ae8ef0009e109296aabf7624ec94211959f359ddaf8e572381530a2eca8fe38a5c86fed9224661183c91015784b3aadffe5a135"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-VendorsModule-36101cf297c6fde903b699348ae8ef0009e109296aabf7624ec94211959f359ddaf8e572381530a2eca8fe38a5c86fed9224661183c91015784b3aadffe5a135"' :
                                            'id="xs-controllers-links-module-VendorsModule-36101cf297c6fde903b699348ae8ef0009e109296aabf7624ec94211959f359ddaf8e572381530a2eca8fe38a5c86fed9224661183c91015784b3aadffe5a135"' }>
                                            <li class="link">
                                                <a href="controllers/VendorsController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >VendorsController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-VendorsModule-36101cf297c6fde903b699348ae8ef0009e109296aabf7624ec94211959f359ddaf8e572381530a2eca8fe38a5c86fed9224661183c91015784b3aadffe5a135"' : 'data-bs-target="#xs-injectables-links-module-VendorsModule-36101cf297c6fde903b699348ae8ef0009e109296aabf7624ec94211959f359ddaf8e572381530a2eca8fe38a5c86fed9224661183c91015784b3aadffe5a135"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-VendorsModule-36101cf297c6fde903b699348ae8ef0009e109296aabf7624ec94211959f359ddaf8e572381530a2eca8fe38a5c86fed9224661183c91015784b3aadffe5a135"' :
                                        'id="xs-injectables-links-module-VendorsModule-36101cf297c6fde903b699348ae8ef0009e109296aabf7624ec94211959f359ddaf8e572381530a2eca8fe38a5c86fed9224661183c91015784b3aadffe5a135"' }>
                                        <li class="link">
                                            <a href="injectables/VendorsService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >VendorsService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/VendorTypesModule.html" data-type="entity-link" >VendorTypesModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-VendorTypesModule-159205a70bf597af465434d7c6c474964d005b880a3b2eb79ebd7ef27f1f178c4a34f3a019bf207fd4a609a5155659a2d8ca271d68bebb11a0326be36588b0de"' : 'data-bs-target="#xs-controllers-links-module-VendorTypesModule-159205a70bf597af465434d7c6c474964d005b880a3b2eb79ebd7ef27f1f178c4a34f3a019bf207fd4a609a5155659a2d8ca271d68bebb11a0326be36588b0de"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-VendorTypesModule-159205a70bf597af465434d7c6c474964d005b880a3b2eb79ebd7ef27f1f178c4a34f3a019bf207fd4a609a5155659a2d8ca271d68bebb11a0326be36588b0de"' :
                                            'id="xs-controllers-links-module-VendorTypesModule-159205a70bf597af465434d7c6c474964d005b880a3b2eb79ebd7ef27f1f178c4a34f3a019bf207fd4a609a5155659a2d8ca271d68bebb11a0326be36588b0de"' }>
                                            <li class="link">
                                                <a href="controllers/VendorTypesController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >VendorTypesController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-VendorTypesModule-159205a70bf597af465434d7c6c474964d005b880a3b2eb79ebd7ef27f1f178c4a34f3a019bf207fd4a609a5155659a2d8ca271d68bebb11a0326be36588b0de"' : 'data-bs-target="#xs-injectables-links-module-VendorTypesModule-159205a70bf597af465434d7c6c474964d005b880a3b2eb79ebd7ef27f1f178c4a34f3a019bf207fd4a609a5155659a2d8ca271d68bebb11a0326be36588b0de"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-VendorTypesModule-159205a70bf597af465434d7c6c474964d005b880a3b2eb79ebd7ef27f1f178c4a34f3a019bf207fd4a609a5155659a2d8ca271d68bebb11a0326be36588b0de"' :
                                        'id="xs-injectables-links-module-VendorTypesModule-159205a70bf597af465434d7c6c474964d005b880a3b2eb79ebd7ef27f1f178c4a34f3a019bf207fd4a609a5155659a2d8ca271d68bebb11a0326be36588b0de"' }>
                                        <li class="link">
                                            <a href="injectables/VendorTypesSeederService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >VendorTypesSeederService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/VendorTypesService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >VendorTypesService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/WalletModule.html" data-type="entity-link" >WalletModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-WalletModule-887101fca4b42cfaaf9ea06790bbbc4326d1fe4dc993f9e77c3aba4a9ac730f7764761d23a83b69b57c5225795ddceb02a29e696a4a4b15b69e98f7d8e14c47b"' : 'data-bs-target="#xs-controllers-links-module-WalletModule-887101fca4b42cfaaf9ea06790bbbc4326d1fe4dc993f9e77c3aba4a9ac730f7764761d23a83b69b57c5225795ddceb02a29e696a4a4b15b69e98f7d8e14c47b"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-WalletModule-887101fca4b42cfaaf9ea06790bbbc4326d1fe4dc993f9e77c3aba4a9ac730f7764761d23a83b69b57c5225795ddceb02a29e696a4a4b15b69e98f7d8e14c47b"' :
                                            'id="xs-controllers-links-module-WalletModule-887101fca4b42cfaaf9ea06790bbbc4326d1fe4dc993f9e77c3aba4a9ac730f7764761d23a83b69b57c5225795ddceb02a29e696a4a4b15b69e98f7d8e14c47b"' }>
                                            <li class="link">
                                                <a href="controllers/WalletController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >WalletController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-WalletModule-887101fca4b42cfaaf9ea06790bbbc4326d1fe4dc993f9e77c3aba4a9ac730f7764761d23a83b69b57c5225795ddceb02a29e696a4a4b15b69e98f7d8e14c47b"' : 'data-bs-target="#xs-injectables-links-module-WalletModule-887101fca4b42cfaaf9ea06790bbbc4326d1fe4dc993f9e77c3aba4a9ac730f7764761d23a83b69b57c5225795ddceb02a29e696a4a4b15b69e98f7d8e14c47b"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-WalletModule-887101fca4b42cfaaf9ea06790bbbc4326d1fe4dc993f9e77c3aba4a9ac730f7764761d23a83b69b57c5225795ddceb02a29e696a4a4b15b69e98f7d8e14c47b"' :
                                        'id="xs-injectables-links-module-WalletModule-887101fca4b42cfaaf9ea06790bbbc4326d1fe4dc993f9e77c3aba4a9ac730f7764761d23a83b69b57c5225795ddceb02a29e696a4a4b15b69e98f7d8e14c47b"' }>
                                        <li class="link">
                                            <a href="injectables/WalletService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >WalletService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/ZonesModule.html" data-type="entity-link" >ZonesModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-ZonesModule-19f421da5f183485541b0ddfcb82af2df2f5072d9dd1566e2cbe89c20a6cc1b2000090b75db6e891b2abb89729b0aa769343ce3d55e58c70033b24d20b66e222"' : 'data-bs-target="#xs-controllers-links-module-ZonesModule-19f421da5f183485541b0ddfcb82af2df2f5072d9dd1566e2cbe89c20a6cc1b2000090b75db6e891b2abb89729b0aa769343ce3d55e58c70033b24d20b66e222"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-ZonesModule-19f421da5f183485541b0ddfcb82af2df2f5072d9dd1566e2cbe89c20a6cc1b2000090b75db6e891b2abb89729b0aa769343ce3d55e58c70033b24d20b66e222"' :
                                            'id="xs-controllers-links-module-ZonesModule-19f421da5f183485541b0ddfcb82af2df2f5072d9dd1566e2cbe89c20a6cc1b2000090b75db6e891b2abb89729b0aa769343ce3d55e58c70033b24d20b66e222"' }>
                                            <li class="link">
                                                <a href="controllers/ZonesController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ZonesController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-ZonesModule-19f421da5f183485541b0ddfcb82af2df2f5072d9dd1566e2cbe89c20a6cc1b2000090b75db6e891b2abb89729b0aa769343ce3d55e58c70033b24d20b66e222"' : 'data-bs-target="#xs-injectables-links-module-ZonesModule-19f421da5f183485541b0ddfcb82af2df2f5072d9dd1566e2cbe89c20a6cc1b2000090b75db6e891b2abb89729b0aa769343ce3d55e58c70033b24d20b66e222"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-ZonesModule-19f421da5f183485541b0ddfcb82af2df2f5072d9dd1566e2cbe89c20a6cc1b2000090b75db6e891b2abb89729b0aa769343ce3d55e58c70033b24d20b66e222"' :
                                        'id="xs-injectables-links-module-ZonesModule-19f421da5f183485541b0ddfcb82af2df2f5072d9dd1566e2cbe89c20a6cc1b2000090b75db6e891b2abb89729b0aa769343ce3d55e58c70033b24d20b66e222"' }>
                                        <li class="link">
                                            <a href="injectables/ZonesService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ZonesService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                </ul>
                </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#classes-links"' :
                            'data-bs-target="#xs-classes-links"' }>
                            <span class="icon ion-ios-paper"></span>
                            <span>Classes</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="classes-links"' : 'id="xs-classes-links"' }>
                            <li class="link">
                                <a href="classes/AddressDto.html" data-type="entity-link" >AddressDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/AssignDriverDto.html" data-type="entity-link" >AssignDriverDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/ChatGateway.html" data-type="entity-link" >ChatGateway</a>
                            </li>
                            <li class="link">
                                <a href="classes/ComplaintDto.html" data-type="entity-link" >ComplaintDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/ContactDto.html" data-type="entity-link" >ContactDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateAddressDto.html" data-type="entity-link" >CreateAddressDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateAdvertisementDto.html" data-type="entity-link" >CreateAdvertisementDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateBannerDto.html" data-type="entity-link" >CreateBannerDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateCashbackDto.html" data-type="entity-link" >CreateCashbackDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateCategoryDto.html" data-type="entity-link" >CreateCategoryDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateChannelDto.html" data-type="entity-link" >CreateChannelDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateCouponDto.html" data-type="entity-link" >CreateCouponDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateDineInBookingDto.html" data-type="entity-link" >CreateDineInBookingDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateDriverDto.html" data-type="entity-link" >CreateDriverDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateOrderDto.html" data-type="entity-link" >CreateOrderDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateProductDto.html" data-type="entity-link" >CreateProductDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateReviewDto.html" data-type="entity-link" >CreateReviewDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateSettingDto.html" data-type="entity-link" >CreateSettingDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateStoryDto.html" data-type="entity-link" >CreateStoryDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateTaxDto.html" data-type="entity-link" >CreateTaxDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateUploadDto.html" data-type="entity-link" >CreateUploadDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateUserDto.html" data-type="entity-link" >CreateUserDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateVendorDto.html" data-type="entity-link" >CreateVendorDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateZoneDto.html" data-type="entity-link" >CreateZoneDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/DriversGateway.html" data-type="entity-link" >DriversGateway</a>
                            </li>
                            <li class="link">
                                <a href="classes/ForgotPasswordDto.html" data-type="entity-link" >ForgotPasswordDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/GlobalExceptionFilter.html" data-type="entity-link" >GlobalExceptionFilter</a>
                            </li>
                            <li class="link">
                                <a href="classes/LoginDto.html" data-type="entity-link" >LoginDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/OrderItemDto.html" data-type="entity-link" >OrderItemDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/OrderItemExtraDto.html" data-type="entity-link" >OrderItemExtraDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/OrdersGateway.html" data-type="entity-link" >OrdersGateway</a>
                            </li>
                            <li class="link">
                                <a href="classes/ProcessOrderProcessor.html" data-type="entity-link" >ProcessOrderProcessor</a>
                            </li>
                            <li class="link">
                                <a href="classes/ProductExtraDto.html" data-type="entity-link" >ProductExtraDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/PurchaseGiftCardDto.html" data-type="entity-link" >PurchaseGiftCardDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/RedeemGiftCardDto.html" data-type="entity-link" >RedeemGiftCardDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/RedeemReferralDto.html" data-type="entity-link" >RedeemReferralDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/RefreshTokenDto.html" data-type="entity-link" >RefreshTokenDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/RegisterDto.html" data-type="entity-link" >RegisterDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/ResetPasswordDto.html" data-type="entity-link" >ResetPasswordDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/SendEmailProcessor.html" data-type="entity-link" >SendEmailProcessor</a>
                            </li>
                            <li class="link">
                                <a href="classes/SendMessageDto.html" data-type="entity-link" >SendMessageDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/SendOtpDto.html" data-type="entity-link" >SendOtpDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/SendPushNotificationProcessor.html" data-type="entity-link" >SendPushNotificationProcessor</a>
                            </li>
                            <li class="link">
                                <a href="classes/SettingsGateway.html" data-type="entity-link" >SettingsGateway</a>
                            </li>
                            <li class="link">
                                <a href="classes/SetWithdrawMethodDto.html" data-type="entity-link" >SetWithdrawMethodDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/SocialLoginDto.html" data-type="entity-link" >SocialLoginDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/SubscribeDto.html" data-type="entity-link" >SubscribeDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/TopUpWalletDto.html" data-type="entity-link" >TopUpWalletDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateAddressDto.html" data-type="entity-link" >UpdateAddressDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateAdvertisementDto.html" data-type="entity-link" >UpdateAdvertisementDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateCategoryDto.html" data-type="entity-link" >UpdateCategoryDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateCouponDto.html" data-type="entity-link" >UpdateCouponDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateDriverDto.html" data-type="entity-link" >UpdateDriverDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateOrderStatusDto.html" data-type="entity-link" >UpdateOrderStatusDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateProductDto.html" data-type="entity-link" >UpdateProductDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateReviewDto.html" data-type="entity-link" >UpdateReviewDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateSettingDto.html" data-type="entity-link" >UpdateSettingDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateUploadDto.html" data-type="entity-link" >UpdateUploadDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateUserDto.html" data-type="entity-link" >UpdateUserDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateVendorDto.html" data-type="entity-link" >UpdateVendorDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateZoneDto.html" data-type="entity-link" >UpdateZoneDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/UploadDriverDocumentDto.html" data-type="entity-link" >UploadDriverDocumentDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/VendorsGateway.html" data-type="entity-link" >VendorsGateway</a>
                            </li>
                            <li class="link">
                                <a href="classes/VerifyOtpDto.html" data-type="entity-link" >VerifyOtpDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/WithdrawWalletDto.html" data-type="entity-link" >WithdrawWalletDto</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#injectables-links"' :
                                'data-bs-target="#xs-injectables-links"' }>
                                <span class="icon ion-md-arrow-round-down"></span>
                                <span>Injectables</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="injectables-links"' : 'id="xs-injectables-links"' }>
                                <li class="link">
                                    <a href="injectables/JwtAuthGuard.html" data-type="entity-link" >JwtAuthGuard</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/RateLimitMiddleware.html" data-type="entity-link" >RateLimitMiddleware</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#guards-links"' :
                            'data-bs-target="#xs-guards-links"' }>
                            <span class="icon ion-ios-lock"></span>
                            <span>Guards</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="guards-links"' : 'id="xs-guards-links"' }>
                            <li class="link">
                                <a href="guards/RolesGuard.html" data-type="entity-link" >RolesGuard</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#interfaces-links"' :
                            'data-bs-target="#xs-interfaces-links"' }>
                            <span class="icon ion-md-information-circle-outline"></span>
                            <span>Interfaces</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"' }>
                            <li class="link">
                                <a href="interfaces/AppleTokenPayload.html" data-type="entity-link" >AppleTokenPayload</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/GoogleTokenPayload.html" data-type="entity-link" >GoogleTokenPayload</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/JwtPayload.html" data-type="entity-link" >JwtPayload</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/OrderAddress.html" data-type="entity-link" >OrderAddress</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/OrderItemExtra.html" data-type="entity-link" >OrderItemExtra</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PaymentResult.html" data-type="entity-link" >PaymentResult</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/VendorMenuPhoto.html" data-type="entity-link" >VendorMenuPhoto</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/VendorPhoto.html" data-type="entity-link" >VendorPhoto</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#miscellaneous-links"'
                            : 'data-bs-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/functions.html" data-type="entity-link">Functions</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/typealiases.html" data-type="entity-link">Type aliases</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <a data-type="chapter-link" href="routes.html"><span class="icon ion-ios-git-branch"></span>Routes</a>
                        </li>
                    <li class="chapter">
                        <a data-type="chapter-link" href="coverage.html"><span class="icon ion-ios-stats"></span>Documentation coverage</a>
                    </li>
                    <li class="divider"></li>
                    <li class="copyright">
                        Documentation generated using <a href="https://compodoc.app/" target="_blank" rel="noopener noreferrer">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});