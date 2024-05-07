bl_info = {
  "name": "WebGL Academy legacy JSON",
  "author": "Xavier Bourry",
  "blender": (2, 93, 0),
  "location": "File > Export > WebGL Academy Legacy JSON",
  "description": "Export JS Meshes",
  "warning": "",
  "wiki_url": "http://www.webglacademy.com",
  "tracker_url": "",
  "support": 'OFFICIAL',
  "category": "Import-Export"}

import math
import os
import bpy
import string
from bpy.props import *
import mathutils, math
import struct
import shutil
from bpy_extras.io_utils import ExportHelper
from os import remove


class Export_mesh(bpy.types.Operator, ExportHelper):            
  bl_idname = "export_mesh.json"
  bl_label = "Export as JSON for WebGL"

  filename_ext = ".json"
  filepath = ""
  def execute(self, context):
    return save(self, context, **self.as_keywords(ignore=("check_existing", "filter_glob")))

def export_mesh(mesh, filepath):

  vertices = "\"vertices\":["
  indices = "\"indices\":["
  webgl_index = 0
  vertices_indices = []
  vertices_UVs = []
  for v in range(0, len(mesh.vertices)):
    vertices_UVs.append([])
    vertices_indices.append([])


  UVmap = mesh.uv_layers[0].data;

  mesh.calc_loop_triangles()
  for tri in mesh.loop_triangles:

    for v in range(3):
      vertex_index = tri.vertices[v]      # vertex index (int)
      vertex = mesh.vertices[vertex_index] # vertex object
      position = vertex.co                 # position of the vertex (vec3)
      normal = vertex.normal               # normal of the vertex (vec3)
      vertex_UV = UVmap[tri.loops[v]].uv

      alreadySaved = False
      index_UV = 0
      for vUV in vertices_UVs[vertex_index]:
        if (vUV[0]==vertex_UV[0] and vUV[1]==vertex_UV[1]):
          alreadySaved = True
          break

        index_UV+=1

      if (alreadySaved):
        ind = vertices_indices[vertex_index][index_UV]

      else:
        vertices_UVs[vertex_index].append(vertex_UV)
        vertices_indices[vertex_index].append(webgl_index)
        ind = webgl_index
        vertices += "%.4f,%.4f,%.4f," % (position.x,position.y,position.z)
        vertices += "%.4f,%.4f,%.4f," % (normal.x,normal.y,normal.z)
        vertices += "%.4f,%.4f," % (vertex_UV[0], vertex_UV[1])
        webgl_index += 1

      indices += "%i," % (ind)

  vertices = vertices.rstrip(',')
  indices = indices.rstrip(',')

  vertices += "],\n"
  indices += "]\n"

  header = "{\n\"name\":\"" + mesh.name + "\",\n"
  footer = "}"
  file_handler = open(filepath, 'w')
  file_handler.write(header)
  file_handler.write(vertices)
  file_handler.write(indices)
  file_handler.write(footer)
  file_handler.close()

def save(operator, context, filepath="", use_apply_modifiers=False, use_triangulate=True, use_compress=False):
  objectsCount = 0

  scene = context.scene
  for object in scene.objects:
    if (object.type == 'MESH' and object.select_get()):
      selected_object = object
      objectsCount += 1


  if (objectsCount == 0):
    raise Exception("Error: Select a mesh first")

  if (objectsCount > 1):
    raise Exception("Error: Select only 1 mesh")

  mesh = selected_object.to_mesh(preserve_all_data_layers=True)


  data_string = export_mesh(mesh, filepath)

  return {'FINISHED'}

### REGISTER ###

def menu_func(self, context):
  self.layout.operator(Export_mesh.bl_idname, text="WebGL Academy legacy JSON export (.json)")
  return

def register():
  bpy.utils.register_class(Export_mesh)
  bpy.types.TOPBAR_MT_file_export.append(menu_func)
  return

def unregister():
  bpy.types.TOPBAR_MT_file_export.remove(menu_func)
  bpy.utils.unregister_class(Export_mesh)
  return

if __name__ == "__main__":
  register()
