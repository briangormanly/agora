/**
 * Agora - Close the loop
 * © 2021-2022 Brian Gormanly
 * BSD 3-Clause License
 * see included LICENSE or https://opensource.org/licenses/BSD-3-Clause 
 */

function resource() {
    this.id = -1;
    this.resourceType = 1;
    this.resourceName = "";
    this.resourceDescription = "";
    this.resourceContentHtml = "";
    this.resourceImage = "";
    this.resourceLink = "";
    this.isRequired = -1;
    this.active = true;
    this.visibility = 2;
    this.createTime;
    this.ownedBy = -1;
}

exports.emptyResource = () => {
    return new resource();
}

exports.ormResource = function (row) {
    let resource = exports.emptyResource();
    resource.id = row.id;
    resource.resourceType = row.resource_type;
    resource.resourceName = row.resource_name;
    resource.resourceDescription = row.resource_description;
    resource.resourceContentHtml = row.resource_content_html;
    resource.resourceImage = row.resource_image;
    resource.resourceLink = row.resource_link;
    resource.isRequired = row.is_required;
    resource.active = row.active;
    resource.visibility = row.visibility;
    resource.createTime = row.create_time;
    resource.ownedBy = row.owned_by;
    return resource;
}