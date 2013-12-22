<a name="1.0.0"></a>
# 1.0.0
## Bug Fixes

## Features
- Added <code>configure</code> function to allow changing configuration options after the resource has been initially configured.
- Added snapshot and rollback extension, be sure to check the [README](README.md#serializers) for details.

## Breaking Changes
- <code>railsResourceFactoryProvider</code> settings have been moved to <code>RailsResourceProvider</code>
- <code>wrapData</code> config option has been renamed <code>rootWrapping</code>
- All resource settings are now stored under the <code>config</code> property on the resource and should be modified using the <code>configure</code> function.
- The following resource settings have been renamed:
    - <code>enableRootWrapping</code> was renamed <code>rootWrapping</code>
    - <code>rootName</code> was renamed <code>name</code>
    - <code>rootPluralName</code> was renamed <code>pluralName</code>
- Query parameters were not underscored previously.  We are now underscoring parameters by default.
The configuration option <code>underscoreParams</code> can be set to false to disable the renaming.

<a name="1.0.0-pre.3"></a>
# 1.0.0-pre.3
## Features
- Added mixin capability, see [README](README.md#mixins) for details
- Added snapshot and rollback extension, see [README](README.md#serializers) for details.
- Added <code>underscoreParams</code> configuration option to allow turning off parameter underscore renaming.

## Breaking Changes
- Query parameters were not underscored previously.  We are now underscoring parameters by default.
    The configuration option <code>underscoreParams</code> can be set to false to disable the renaming.

<a name="1.0.0-pre.2"></a>
# 1.0.0-pre.2
## Bug Fixes
- Support submitting array data (#85)

<a name="1.0.0-pre.1"></a>
# 1.0.0-pre.1
## Bug Fixes

## Features
- Added <code>configure</code> function to allow changing configuration options after the resource has been initially configured.

## Breaking Changes
- <code>railsResourceFactoryProvider</code> settings have been moved to <code>RailsResourceProvider</code>
- <code>wrapData</code> config option has been renamed <code>rootWrapping</code>
- All resource settings are now stored under the <code>config</code> property on the resource and should be modified using the <code>configure</code> function.
- The following resource settings have been renamed:
    - <code>enableRootWrapping</code> was renamed <code>rootWrapping</code>
    - <code>rootName</code> was renamed <code>name</code>
    - <code>rootPluralName</code> was renamed <code>pluralName</code>
- Query parameters were not underscored previously.  We are now underscoring parameters by default.
    The configuration option <code>underscoreParams</code> can be set to false to disable the renaming.
- Replaced <code>railsRootWrappingTransformer</code> and <code>railsRootWrappingInterceptor</code> with <code>railsRootWrapper</code>
    that has wrap & unwrap methods.  This eliminates the need for using promises during resource construction to handle unwrapping
    data passed into the constructor.
- Resource constructor no longer executes response interceptors.  If you need to customize the constructor you should look
    at using subclassing instead.
- <code>processResponse</code>, <code>transformData</code>, <code>callInterceptors</code> have all been removed as part of rewriting
    the request / response handling.

<a name="0.2.5"></a>
# 0.2.5
## Bug Fixes
- Support submitting array data (#85)

<a name="0.2.4"></a>
# 0.2.4
## Bug Fixes
- Fix mapped name behavior when using serializer default exclusion (#81)

<a name="0.2.3"></a>
# 0.2.3
## Bug Fixes
- Issue #67 incorrect date deserialization led to errors constructing a new resource with a property that was type Date

<a name="0.2.2"></a>
# 0.2.2
## Bug Fixes

## Features
- Added updateMethod configuration option to railsResourceFactory to specify what HTTP method should be used to perform the update action
- Exposed default configuration options for both railsResourceFactory and railsSerializer as provider configuration options.

<a name="0.2.1"></a>
# 0.2.1
## Bug Fixes

## Features
- Added context property to before response interceptors to have access to the calling resource instance in the case of create/update/delete.
- Added after response interceptors to be able to define custom callbacks that execute on all resources after method completion.

<a name="0.2.0"></a>
# 0.2.0
## Breaking Changes
- Removed default transformers and interceptors
    - railsFieldRenamingTransformer and railsFieldRenamingInterceptor have been removed completely and replaced by the serializers
    - railsRootWrappingTransformer/Interceptor are no longer configured by the transformers/interceptors configuration option and is instead
      configured by the <code>wrapData</code> option.
- Interceptors added using <code>beforeRequest</code> are run before any deserialization so the fields names have not been camelized.

## Bug Fixes

## Features
- Added serializers to replace old field renaming logic and to give users a lot more flexibility in customizing the (de)serialization process
- Added <code>rootWrapping</code> configuration option to be able to turn off root wrapping instead
- Added path option to <code>$url</code> methods to make it easier to construct a nested url.

<a name="0.1.7"></a>
# 0.1.7
## Bug Fixes

## Features
- New <code>save</code> instance method added to resources

<a name="0.1.6"></a>
# 0.1.6
## Bug Fixes

## Features
- Added beforeRequest and beforeResponse methods that wrap a given function as a transformer/interceptor to more easily add customizations

<a name="0.1.5"></a>
# 0.1.5

## Bug Fixes

## Features
- Added setUrl method to allow reconfiguring a resource's url after creation
- Added $url instance method to more easily reference the instance's URL
- Added instance and class methods for generic HTTP operations of $get, $post, $put, $delete



