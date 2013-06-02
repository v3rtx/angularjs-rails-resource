<a name="0.2.0"></a>
# 0.2.0
## Bug Fixes

## Features
- Added serializers to replace old field renaming logic and to give users a lot more flexibility in customizing the (de)serialization process
- Added <code>enableRootWrapping</code> configuration option to be able to turn off root wrapping instead
- Added path option to

## Breaking Changes
- Removed default transformers and interceptors
    - railsFieldRenamingTransformer and railsFieldRenamingInterceptor have been removed completely and replaced by the serializers
    - railsRootWrappingTransformer/Interceptor are no longer configured by the transformers/interceptors configuration option and is instead
      configured by the <code>enableRootWrapping</code> option.

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



