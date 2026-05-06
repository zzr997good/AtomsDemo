import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.plan_annotations import Plan_annotationsService
from dependencies.auth import get_current_user
from schemas.auth import UserResponse

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/plan_annotations", tags=["plan_annotations"])


# ---------- Pydantic Schemas ----------
class Plan_annotationsData(BaseModel):
    """Entity data schema (for create/update)"""
    annotation_id: str
    author_id: str = None
    author_name: str = None
    author_role: str = None
    avatar_color: str = None
    type: str = None
    target_section: str = None
    content: str
    ann_timestamp: int = None


class Plan_annotationsUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    annotation_id: Optional[str] = None
    author_id: Optional[str] = None
    author_name: Optional[str] = None
    author_role: Optional[str] = None
    avatar_color: Optional[str] = None
    type: Optional[str] = None
    target_section: Optional[str] = None
    content: Optional[str] = None
    ann_timestamp: Optional[int] = None


class Plan_annotationsResponse(BaseModel):
    """Entity response schema"""
    id: int
    user_id: str
    annotation_id: str
    author_id: Optional[str] = None
    author_name: Optional[str] = None
    author_role: Optional[str] = None
    avatar_color: Optional[str] = None
    type: Optional[str] = None
    target_section: Optional[str] = None
    content: str
    ann_timestamp: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Plan_annotationsListResponse(BaseModel):
    """List response schema"""
    items: List[Plan_annotationsResponse]
    total: int
    skip: int
    limit: int


class Plan_annotationsBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[Plan_annotationsData]


class Plan_annotationsBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: Plan_annotationsUpdateData


class Plan_annotationsBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[Plan_annotationsBatchUpdateItem]


class Plan_annotationsBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=Plan_annotationsListResponse)
async def query_plan_annotationss(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Query plan_annotationss with filtering, sorting, and pagination (user can only see their own records)"""
    logger.debug(f"Querying plan_annotationss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = Plan_annotationsService(db)
    try:
        # Parse query JSON if provided
        query_dict = None
        if query:
            try:
                query_dict = json.loads(query)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid query JSON format")
        
        result = await service.get_list(
            skip=skip, 
            limit=limit,
            query_dict=query_dict,
            sort=sort,
            user_id=str(current_user.id),
        )
        logger.debug(f"Found {result['total']} plan_annotationss")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying plan_annotationss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=Plan_annotationsListResponse)
async def query_plan_annotationss_all(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query plan_annotationss with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying plan_annotationss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = Plan_annotationsService(db)
    try:
        # Parse query JSON if provided
        query_dict = None
        if query:
            try:
                query_dict = json.loads(query)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid query JSON format")

        result = await service.get_list(
            skip=skip,
            limit=limit,
            query_dict=query_dict,
            sort=sort
        )
        logger.debug(f"Found {result['total']} plan_annotationss")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying plan_annotationss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=Plan_annotationsResponse)
async def get_plan_annotations(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single plan_annotations by ID (user can only see their own records)"""
    logger.debug(f"Fetching plan_annotations with id: {id}, fields={fields}")
    
    service = Plan_annotationsService(db)
    try:
        result = await service.get_by_id(id, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Plan_annotations with id {id} not found")
            raise HTTPException(status_code=404, detail="Plan_annotations not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching plan_annotations {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=Plan_annotationsResponse, status_code=201)
async def create_plan_annotations(
    data: Plan_annotationsData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new plan_annotations"""
    logger.debug(f"Creating new plan_annotations with data: {data}")
    
    service = Plan_annotationsService(db)
    try:
        result = await service.create(data.model_dump(), user_id=str(current_user.id))
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create plan_annotations")
        
        logger.info(f"Plan_annotations created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating plan_annotations: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating plan_annotations: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[Plan_annotationsResponse], status_code=201)
async def create_plan_annotationss_batch(
    request: Plan_annotationsBatchCreateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create multiple plan_annotationss in a single request"""
    logger.debug(f"Batch creating {len(request.items)} plan_annotationss")
    
    service = Plan_annotationsService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump(), user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} plan_annotationss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[Plan_annotationsResponse])
async def update_plan_annotationss_batch(
    request: Plan_annotationsBatchUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update multiple plan_annotationss in a single request (requires ownership)"""
    logger.debug(f"Batch updating {len(request.items)} plan_annotationss")
    
    service = Plan_annotationsService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict, user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} plan_annotationss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=Plan_annotationsResponse)
async def update_plan_annotations(
    id: int,
    data: Plan_annotationsUpdateData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing plan_annotations (requires ownership)"""
    logger.debug(f"Updating plan_annotations {id} with data: {data}")

    service = Plan_annotationsService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Plan_annotations with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Plan_annotations not found")
        
        logger.info(f"Plan_annotations {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating plan_annotations {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating plan_annotations {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_plan_annotationss_batch(
    request: Plan_annotationsBatchDeleteRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple plan_annotationss by their IDs (requires ownership)"""
    logger.debug(f"Batch deleting {len(request.ids)} plan_annotationss")
    
    service = Plan_annotationsService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id, user_id=str(current_user.id))
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} plan_annotationss successfully")
        return {"message": f"Successfully deleted {deleted_count} plan_annotationss", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_plan_annotations(
    id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a single plan_annotations by ID (requires ownership)"""
    logger.debug(f"Deleting plan_annotations with id: {id}")
    
    service = Plan_annotationsService(db)
    try:
        success = await service.delete(id, user_id=str(current_user.id))
        if not success:
            logger.warning(f"Plan_annotations with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Plan_annotations not found")
        
        logger.info(f"Plan_annotations {id} deleted successfully")
        return {"message": "Plan_annotations deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting plan_annotations {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")