# Akeneo Versioning API
## Installation
### Requirements
* Akeneo PIM >= 6.0
* PHP 8.0
### Install via composer:
```bash
composer config repositories.akeneo-versioning-api vcs git@github.com:mediataivas/akeneo-versioning-api.git
composer require vincit/versioning-api
```
### Manual steps
Add bundle to config/bundles.php:
```php
return [
    // Add your bundles here with the associated env.
    // Ex:
    // Acme\Bundle\AppBundle\AcmeAppBundle::class => ['dev' => true, 'test' => true, 'prod' => true]
    Vincit\VersioningApi\Bundle\VersioningApiBundle::class => ['all' => true]
];
```
Create routing definition file, e.g. config/routes/versioning_api.yml with the content:
```yaml
versioning_api:
  resource: "@VersioningApiBundle/Resources/config/routing.yml"
```
In the root package.json add:
```json
{
  ...
  "workspaces": [
    ...
    "src/Vincit/VersioningApi" (if installed manually)
    "vendor/vincit/versioning-api" (if installed via composer)
  ],
  "resolutions": {
    "date-fns": "^2.28.0"
  }        
}
```
